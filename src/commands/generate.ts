import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { EmbedBuilder } from 'discord.js';

@ApplyOptions<Subcommand.Options>({
	description: 'generate embeds!',
	requiredUserPermissions: ['ManageMessages'],
	subcommands: [
		{
			name: 'faq',
			chatInputRun: 'faqEmbed'
		}
	]
})
export class UserCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((command) =>
					command
						.setName('faq')
						.setDescription('Generate FAQ embeds for the FAQ Channel!')
						.addStringOption((option) => option.setName('question').setDescription('What is frequently asked').setRequired(true))
						.addStringOption((option) => option.setName('answer').setDescription('What is the same answer').setRequired(true))
				)
		);
	}

	public async faqEmbed(interaction: Subcommand.ChatInputCommandInteraction) {
		const embedTemplate = new EmbedBuilder()
			.setColor('#e94d51')
			.setTitle(`Q: ${interaction.options.getString('question', true)}`)
			.setDescription(`A: ${interaction.options.getString('answer', true)}`)
			.setTimestamp();

		await interaction.channel?.send({
			embeds: [embedTemplate]
		});

		return interaction.reply({ content: 'Embed Sent Successfully!', ephemeral: true });
	}
}
