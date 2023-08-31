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
import { createReadStream } from 'fs';
import path from 'path';
import csvParser from 'csv-parser';

interface namesRow {
	'Year of Birth': string;
	Gender: string;
	Ethnicity: string;
	"Child's First Name": string;
	Count: string;
	Rank: string;
}

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

		const CEName = (await this.parseNames()) as string[];

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

	private async parseNames() {
		return new Promise((resolve, reject) => {
			const names: string[] = [];
			const stream = createReadStream(path.join(__dirname, '../lib/Popular_Baby_Names.csv')).pipe(csvParser());

			stream.on('data', (row: namesRow) => {
				if (row["Child's First Name"]) {
					names.push(row["Child's First Name"]);
				}
			});

			stream.on('end', () => {
				resolve(names);
			});

			stream.on('error', (error: any) => {
				reject(error);
			});
		});
	}
}
