import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import {
	EmbedBuilder,
	TextChannel,
	type GuildMember,
	ActionRowBuilder,
	type MessageActionRowComponentBuilder,
	ButtonBuilder,
	ButtonStyle
} from 'discord.js';
import config from '../config.json';
import CEName from './modToolsPreload';

@ApplyOptions<Listener.Options>({
	name: 'Member Screening',
	event: Events.GuildMemberAdd
})
export class UserEvent extends Listener {
	public override async run(member: GuildMember) {
		const username = member.user.username;
		const staffChannel = (await member.guild.channels.fetch(config.staffNotificationChannel)) as TextChannel | null;

		if (!staffChannel)
			return this.container.logger.warn(
				`Did not screen @${member.user.username}, couldn't find staff channel ${config.staffNotificationChannel}`
			);

		if (CEName.length === 0) {
			return staffChannel.send(`Cannot screen ${member} because CEName is still loading...`);
		}

		const regex = new RegExp(CEName.join('|'), 'i');

		if (username.match(regex)) {
			await member.roles.add(config.flagRole);

			const staffActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
				new ButtonBuilder().setCustomId(`screen|${member.id}|approve`).setEmoji('✅').setLabel('Approve').setStyle(ButtonStyle.Success),
				new ButtonBuilder().setCustomId(`screen|${member.id}|reject`).setEmoji('❌').setLabel('Ban').setStyle(ButtonStyle.Secondary)
			);

			const notificationEmbed = new EmbedBuilder()
				.setColor('Red')
				.setTitle('🤚 Abnormal Profile Behaviour Detected!')
				.setDescription(
					"You have been automatically flagged by VTA Bot and will undergo manual screening by one of our staff members. Do not worry, this won't take long!"
				)
				.setTimestamp();

			await member.send({ embeds: [notificationEmbed] }).then(
				() => {
					notificationEmbed.setFooter({ text: 'User was notified.' });
				},
				() => {
					notificationEmbed.setFooter({ text: "User couldn't be notified" });
				}
			);

			notificationEmbed.setDescription(`VTA Bot has flagged ${member} from interacting within the server.`);

			return staffChannel.send({
				embeds: [notificationEmbed],
				components: [staffActionRow]
			});
		} else {
			const notificationEmbed = new EmbedBuilder()
				.setColor('Green')
				.setTitle('✅ Automatic Screening shows no errors')
				.setDescription(`${member} has passed VTA's automatic screening process`)
				.setTimestamp();

			const staffActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
				new ButtonBuilder().setCustomId(`screen|${member.id}|reject`).setEmoji('❌').setLabel('Ban').setStyle(ButtonStyle.Secondary)
			);

			staffChannel?.send({ embeds: [notificationEmbed], components: [staffActionRow] });
		}
	}
}
