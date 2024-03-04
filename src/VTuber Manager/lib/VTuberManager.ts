import { VTuberFormTemplate } from '../routes/vtuberSubmission';
import { EventEmitter } from 'events';
import { container } from '@sapphire/pieces';
import config from '../config.json';
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageActionRowComponentBuilder } from 'discord.js';
import VTuberFormResponseModel from './VTubers';

class manageVTubers extends EventEmitter {
	async newApplication(vTuberData: VTuberFormTemplate) {
		const database = new VTuberFormResponseModel(vTuberData);

		const discordMember = await this.fetchDiscordMember(vTuberData['Discord ID']);
		if (!discordMember) {
			await database.deleteOne();
			return container.logger.warn(`[VTuber Manager] deleted ${vTuberData['Discord ID']} due to an error fetching discord member`);
		}

		// Message components
		const embedData = this.createEmbed(vTuberData);
		const messageRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			new ButtonBuilder().setCustomId(`vtuber:apply`).setLabel('Confirm').setStyle(ButtonStyle.Success)
		);

		const message = await discordMember.send({
			embeds: embedData.embeds,
			files: embedData.files,
			components: [messageRow],
			content: `# VTA Bot has received your application!\n
			Please make sure the information is correct and click confirm when you are ready! If there are errors, correct them through the google form using edit response!`
		});

		database.Status = {
			code: 'Confirmation',
			id: message.id,
			lastUpdated: new Date()
		};

		await database.save();
		return this.emit('newApplication', vTuberData);
	}

	async updateApplication(vTuberData: VTuberFormTemplate) {
		let database = await VTuberFormResponseModel.findOne({ 'Discord ID': vTuberData['Discord ID'] });
		if (!database) return container.logger.error('Failed to fetch db while notifying review');

		const discordMember = await this.fetchDiscordMember(vTuberData['Discord ID']);
		if (!discordMember) return container.logger.error('Failed to fetch member while notifying review');

		if (database.Status.code === 'Confirmation') {
			// if confirmation message exists, delete it before resetting record
			database.Status.id ? (await discordMember.dmChannel?.messages.fetch(database.Status.id))?.delete() : 0;
			await database.deleteOne();
			return this.newApplication(vTuberData);
		} else if (database.Status.code === 'Review') {
			// if review message exists, delete it before resetting record
			database.Status.id ? (await (await this.fetchDiscordChannel())?.messages.fetch(database.Status.id))?.delete() : 0;
			await database.deleteOne();
			return this.sendReview(vTuberData['Discord ID']);
		}

		database = Object.assign(database, vTuberData);
		database.Status = {
			code: database.Status.code,
			lastUpdated: new Date()
		};
		await database.save();

		const embedData = this.createEmbed(vTuberData);
		await discordMember.send({
			embeds: embedData.embeds,
			files: embedData.files,
			content: `# Application Updated!\nYour profile has been updated!`
		});

		return this.emit('updatedApplication', vTuberData);
	}

	async deleteApplication(discordId: string) {
		const channel = await this.fetchDiscordChannel();
		const member = await this.fetchDiscordMember(discordId);
		if (!member || !channel) return;

		const database = await VTuberFormResponseModel.findOne({ 'Discord ID': discordId });
		if (!database) return container.logger.error('Failed to fetch db while notifying review');

		if (database.Status.id) {
			if (database.Status.code === 'Confirmation') {
				await member.dmChannel?.messages
					.fetch(database.Status.id)
					.then((msg) => msg.delete())
					.catch(() => undefined);
			}

			if (database.Status.code === 'Review') {
				await channel?.messages
					.fetch(database.Status.id)
					.then((msg) => msg.delete())
					.catch(() => undefined);
			}
		}

		await database.deleteOne();

		const embedInfo = this.createEmbed(database.toObject() as VTuberFormTemplate);
		await member.send({
			embeds: embedInfo.embeds,
			files: embedInfo.files,
			content: `# Application Deleted!\nWiped off the surface of the Amari world. If you wish to reapply, please do so through the google form.`
		});

		return this.emit('vtuberDeleted', database.toObject() as VTuberFormTemplate);
	}

	async sendReview(discordId: string) {
		const database = await VTuberFormResponseModel.findOne({ 'Discord ID': discordId });
		if (!database) return container.logger.error('Failed to fetch db while notifying review');

		const channel = await this.fetchDiscordChannel();
		if (!channel) return container.logger.error('Failed to fetch channel while notifying review');

		const embedInfo = this.createEmbed(database.toObject() as VTuberFormTemplate);

		const moderatorActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();
		moderatorActionRow.addComponents(
			new ButtonBuilder().setCustomId(`vtuber:accept:${discordId}`).setLabel('Approve').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId(`vtuber:reject:${discordId}`).setLabel('Deny').setStyle(ButtonStyle.Danger)
		);

		const message = await channel.send({
			embeds: embedInfo.embeds,
			files: embedInfo.files,
			components: [moderatorActionRow]
		});

		database.Status = {
			id: message.id,
			code: 'Review',
			lastUpdated: new Date()
		};

		await database.save();

		const member = await this.fetchDiscordMember(database['Discord ID']);
		if (!member) return container.logger.error('Failed to fetch member while notifying review');

		await member.send({ content: `# Application Received!\nYour application has been sent to the team to verify its contents.` });

		return this.emit('vtuberReview', database.toObject() as VTuberFormTemplate);
	}

	async acceptApplication(discordId: string) {
		const vtuber = await VTuberFormResponseModel.findById(discordId);
		if (!vtuber) return container.logger.error('Failed to fetch db while accepting application');

		const member = await this.fetchDiscordMember(discordId);
		const embedInfo = VTuberManager.createEmbed(vtuber.toObject() as VTuberFormTemplate);

		vtuber.Status = {
			code: 'Accepted',
			id: undefined,
			lastUpdated: new Date()
		};
		await vtuber.save();

		await member?.send({
			embeds: embedInfo.embeds,
			files: embedInfo.files,
			content: '# Congratulations! 🎉\nYour VTuber Application has been approved!'
		});

		await this.assignRole(discordId);

		return this.emit('vtuberAccepted', vtuber.toObject() as VTuberFormTemplate);
	}

	async rejectApplication(discordId: string, reason: string) {
		const database = await VTuberFormResponseModel.findOne({ 'Discord ID': discordId });
		if (!database) return container.logger.error('Failed to fetch db while rejecting application');

		const member = await this.fetchDiscordMember(discordId);
		if (!member) return container.logger.error('Failed to fetch member while rejecting application');

		const embedInfo = this.createEmbed(database.toObject() as VTuberFormTemplate);
		await member.send({
			embeds: embedInfo.embeds,
			files: embedInfo.files,
			content: `# Application Denied!\n\n${reason}`
		});

		await database.deleteOne();
		return this.emit('vtuberDenied', database.toObject() as VTuberFormTemplate);
	}

	async fetchDiscordServer() {
		return container.client.guilds.fetch(config.managingServer).catch((err) => {
			container.logger.error('[VTuberManager] could not fetch discord server!');
			console.error(err);

			return undefined;
		});
	}

	async fetchDiscordMember(id: string) {
		const server = await this.fetchDiscordServer();
		if (!server) return undefined;

		return server.members.fetch(id).catch(() => {
			container.logger.error(`[VTuberManager] could not fetch member ${id}`);
			return undefined;
		});
	}

	async fetchDiscordChannel() {
		const server = await this.fetchDiscordServer();
		if (!server) return undefined;

		return server.channels
			.fetch(config.applicationChannel)
			.catch(() => {
				container.logger.error('[VTuberManager] could not fetch discord channel!');
				return undefined;
			})
			.then((channel) => {
				if (!channel?.isTextBased()) {
					container.logger.error('[VTuberManager] channel is not text based!');
					return undefined;
				}

				return channel;
			});
	}

	createEmbed(formResponse: VTuberFormTemplate) {
		const embed = new EmbedBuilder()
			.setColor('#e94e4e')
			.setTitle(`${formResponse['VTuber Name'] ?? 'Profile scheduled deletation'}`)
			.setDescription(`${formResponse['Description (3rd person perspective recommended)'] ?? 'Profile scheduled deletation'}`)
			.setTimestamp();

		const files: AttachmentBuilder[] = [];
		if (formResponse['Do you want to delete your application?'] === 'Yes') {
			embed.addFields([
				{ name: 'Profile is scheduled for deletation', value: 'This process does not require staff intervention', inline: true }
			]);
		} else {
			const avatar = decode_base64(formResponse['VTuber Avatar (Square Size Preferred)'], formResponse['VTuber Name'].replace(' ', ''));
			files.push(avatar.attachment);

			embed.setThumbnail(`attachment://${avatar.filename}`);

			embed.addFields([
				{ name: 'Model Type', value: formResponse['Model Type'], inline: true },
				{ name: 'Debut Date', value: formResponse['Debut Date'], inline: true },
				{ name: 'Genre', value: formResponse['Genre'].join(', '), inline: true },
				{ name: 'Language', value: formResponse['Language'], inline: true }
			]);

			if (formResponse['Do you stream?'] === 'Yes') {
				embed.addFields([{ name: 'Streaming Platform', value: formResponse['Twitch / YouTube URL'], inline: true }]);
			}

			if (formResponse['Do you make regular content? (Videos)'] === 'Yes') {
				embed.addFields([{ name: 'Content Platform', value: formResponse['YouTube / TikTok URL'], inline: true }]);
			}
		}

		return { embeds: [embed], files };
	}

	async assignRole(id: string) {
		const member = await this.fetchDiscordMember(id);
		const role = await (await this.fetchDiscordServer())?.roles.fetch(config.vtuberRole);

		const interval = setInterval(async () => {
			if (!member || !role) return;

			const application = await VTuberFormResponseModel.findOne({ 'Discord ID': member.id });
			if (!application) {
				await member.roles.remove(role);
				clearInterval(interval);
				return;
			}

			if (application.Status.code !== 'Accepted') {
				await member.roles.remove(role);
				clearInterval(interval);
				return;
			}

			if (!member.roles.cache.has(role.id)) {
				await member.roles.add(role);
			}

			return;
		}, 300000);
	}
}

function decode_base64(b64d: { 64: string; mime: string }, name: string) {
	const filename = `${name}.${b64d.mime.split('image/')[1]}`;
	return { attachment: new AttachmentBuilder(Buffer.from(b64d[64], 'base64'), { name: filename }), filename };
}

const VTuberManager = new manageVTubers();
export default VTuberManager;
