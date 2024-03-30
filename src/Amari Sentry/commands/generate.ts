import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { Duration } from '@sapphire/time-utilities';
import { EmbedBuilder } from 'discord.js';

@ApplyOptions<Subcommand.Options>({
	enabled: true,
	name: 'generate',
	description: 'generate...?',
	requiredUserPermissions: ['Administrator'],
	requiredClientPermissions: ['SendMessages', 'BanMembers', 'ViewChannel'],
	runIn: ['GUILD_TEXT'],
	subcommands: [
		{
			name: 'modlog',
			chatInputRun: 'transparencyReport'
		}
	]
})
export class UserCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((subcommand) => subcommand.setName('modlog').setDescription('Generate a transparency report'))
		);
	}

	public async transparencyReport(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		const today = new Date();
		const imageOfTheMonth = await this.container.unsplash.search
			.getPhotos({
				query: today.toLocaleString('default', { month: 'long' }),
				orderBy: 'latest',
				perPage: 1
			})
			.then((res) => res.response?.results[0].urls.regular);

		if (!imageOfTheMonth) return interaction.editReply('Failed to fetch image of the month!');

		const bans = await interaction.guild?.bans.fetch({ after: `${(today.getTime() - new Duration('1 month').offset) / 1000}` });
		const susAccounts = bans?.filter((ban) => ban.reason?.startsWith('Suspicious or spam account'));

		let banCounts = { manual: 0, auto: 0 };

		for (const ban of susAccounts?.values() ?? []) {
			if (ban.reason === 'Suspicious or spam account') {
				banCounts.manual++;
			} else {
				banCounts.auto++;
			}
		}

		const embed1 = new EmbedBuilder()
			.setAuthor({ name: interaction.guild?.name ?? '', iconURL: interaction.guild?.iconURL() ?? '' })
			.setColor('Blurple')
			.setTitle(`Transparency Report [${today.getMonth()} | ${today.getFullYear()}]`)
			.setDescription(
				'The mods are hard at work to keep the server safe and clean. Here is a report of what they have done this month! Additional Reports from the Owner can be found by visiting the thread in this message!\n\nThis report is generated to visualize the work of the moderation team and to keep the community informed of the actions taken to keep the server safe and clean. We hope you continue to trust us with your safety and security within the VTA!'
			)
			.addFields([
				{
					name: 'Amari Security Statistics',
					value: `Total Bans: ${bans?.size ?? 0}\nManual Spam Bans: ${banCounts.manual}\nAutomatic Spam Bans: ${banCounts.auto}`,
					inline: false
				},
				{
					name: 'Additional Reports Unavailable',
					value: 'Since this is the start, data has not been collected yet. Please check back next month for more reports!'
				}
			])
			.setImage(imageOfTheMonth)
			.setTimestamp();

		return interaction.editReply({ embeds: [embed1] });
	}
}
