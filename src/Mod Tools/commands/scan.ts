import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { createReadStream } from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type MessageActionRowComponentBuilder } from 'discord.js';

interface namesRow {
	'Year of Birth': string;
	Gender: string;
	Ethnicity: string;
	"Child's First Name": string;
	Count: string;
	Rank: string;
}

@ApplyOptions<Command.Options>({
	description: 'Scan server member list for suspicious members',
	requiredUserPermissions: ['BanMembers']
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const members = interaction.guild?.members.cache;
		if (!members) return interaction.reply({ content: 'Members not cached!', ephemeral: true });

		const commonNames = (await this.parseNames()) as string[];

		const regex = new RegExp(commonNames.join('|'), 'i');

		await interaction.reply({
			content: 'Started Scanning',
			ephemeral: true
		});

		members.forEach(async (member) => {
			if (member.user.username.match(regex)) {
				const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
					new ButtonBuilder().setCustomId(`screen|${member.id}|approve`).setEmoji('✅').setLabel('Approve').setStyle(ButtonStyle.Success),
					new ButtonBuilder().setCustomId(`screen|${member.id}|reject`).setEmoji('❌').setLabel('Ban').setStyle(ButtonStyle.Secondary)
				);

				interaction.channel?.send({
					content: `VTA Bot found ${member} suspicious`,
					components: [actionRow]
				});
			}

			interaction.client.logger.info(`Scanned ${member.user.username}`);
		});

		return;
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
