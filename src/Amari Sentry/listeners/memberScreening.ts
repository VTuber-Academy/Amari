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

interface MemberFlagInterface {
	isFlagged: boolean;
	reasons?: string[];
}

interface NamesRow {
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
		const flag: MemberFlagInterface = { isFlagged: false, reasons: [] };

		const username = member.user.username;
		const staffChannel = (await member.guild.channels.fetch(config.staffNotificationChannel)) as TextChannel | null;

		if (!staffChannel)
			return this.container.logger.warn(
				`Did not screen @${member.user.username}, couldn't find staff channel ${config.staffNotificationChannel}`
			);

		const CEName = (await this.parseNames()) as string[];

		if (CEName.length === 0) {
			return staffChannel.send(`Cannot screen ${member} because Centrie is still loading...`);
		}

		const regex = new RegExp(CEName.join('|'), 'i');

		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

		const oneMonthAgo = new Date();
		oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

		if (username.match(regex) && member.user.createdAt > sixMonthsAgo) {
			flag.isFlagged = true;
			flag.reasons?.push(`❗ Username matches our filters and account age is less than 6 months`);
		} else if (member.user.createdAt < sixMonthsAgo) {
			flag.reasons?.push('✅ Username matching skipped, account age higher than six months');
		} else {
			flag.reasons?.push("⚠️ Username doesn't match but account age created within six months");
		}

		if (member.user.createdAt > oneMonthAgo) {
			flag.isFlagged = true;
			flag.reasons?.push('❗ Account age less than one month');
		}

		if (flag.isFlagged) {
			await member.roles.add(config.flagRole);

			const staffActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
				new ButtonBuilder().setCustomId(`screen|${member.id}|approve|yes`).setEmoji('✅').setLabel('Approve').setStyle(ButtonStyle.Success),
				new ButtonBuilder().setCustomId(`screen|${member.id}|reject`).setEmoji('❌').setLabel('Ban').setStyle(ButtonStyle.Secondary)
			);

			const notificationEmbed = new EmbedBuilder()
				.setColor('Red')
				.setTitle('🤚 CENTRIE has halted an activity')
				.setDescription(
					"Welcome to the VTA! You have been automatically flagged by CENtrie and will undergo manual screening by one of our staff members. Do not worry, this won't take long!\n\nCentrie is VTA's security bot looking out for potentially malicious profiles and every process is automatic while being under the supervision of a staff member."
				)
				.setTimestamp();

			notificationEmbed.addFields({ name: 'Reasons', value: `${flag.reasons?.join('\n')}` });

			await member.send({ embeds: [notificationEmbed] }).then(
				() => {
					notificationEmbed.setFooter({ text: 'User was notified.' });
				},
				() => {
					notificationEmbed.setFooter({ text: "User couldn't be notified" });
				}
			);

			notificationEmbed.setDescription(`${member} has been caught by CENtrie and is waiting for a staff member to screen them.`);

			return staffChannel.send({
				embeds: [notificationEmbed],
				components: [staffActionRow]
			});
		} else {
			const notificationEmbed = new EmbedBuilder().setColor('Green').setTitle('✅ CENtrie allowed a member').setTimestamp();

			notificationEmbed.addFields({ name: 'Reasons', value: `${flag.reasons?.join('\n')}` });

			const staffActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
				new ButtonBuilder().setCustomId(`screen|${member.id}|approve|no`).setEmoji('✅').setLabel('Approve').setStyle(ButtonStyle.Success),
				new ButtonBuilder().setCustomId(`screen|${member.id}|reject`).setEmoji('❌').setLabel('Ban').setStyle(ButtonStyle.Secondary)
			);

			notificationEmbed.setDescription(`${member} has been scanned by CENtrie and doesn't show any errors.`);

			staffChannel?.send({ embeds: [notificationEmbed], components: [staffActionRow] });
		}
	}

	private async parseNames() {
		return new Promise((resolve, reject) => {
			const names: string[] = [];
			const stream = createReadStream(path.join(__dirname, '../lib/Popular_Baby_Names.csv')).pipe(csvParser());

			stream.on('data', (row: NamesRow) => {
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
