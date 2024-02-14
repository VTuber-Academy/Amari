import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import levelDatabase from 'Amari Levels/lib/levelDataBase';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	MessageActionRowComponentBuilder,
	MessageComponentInteraction
} from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Use your levels to get a scuffed score of how much VTA bot loves you!'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption((option) => option.setName('user').setDescription('Leave empty if you want hehe.').setRequired(false))
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const profile = await levelDatabase.findOne({ id: interaction.user.id });

		if (!profile) return interaction.reply({ content: 'Start meowing to gain levels!', ephemeral: true });

		const warningEmbed = new EmbedBuilder()
			.setColor('Yellow')
			.setTitle(`Warning! ⚠️`)
			.setDescription('1 Level will be deducted to your account for this action. Are you sure you want to continue?')
			.setTimestamp();

		const warningRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId('confirm-valentine')
				.setEmoji('✅')
				.setLabel('How much does VTA Bot love me? 💞')
				.setStyle(ButtonStyle.Danger)
		);

		const msg = await interaction.reply({ embeds: [warningEmbed], components: [warningRow] });

		const filter = (i: MessageComponentInteraction) => i.customId === 'confirm-valentine' && i.user.id === interaction.user.id;

		const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 30000, max: 1 });

		collector?.on('collect', async () => {
			if (!profile) return;

			profile.level -= 1;
			const target = interaction.options.getUser('user')?.displayName ?? 'VTA Bot';

			const notifier = new EmbedBuilder()
				.setColor('Red')
				.setTitle(`Your compatibility with ${target} is ${Math.floor(Math.random() * 100)}%! 💞`)
				.setDescription(
					`${interaction.user.username} has modified your level to: \n\`\`\`Level: ${profile.level}\nExperience: ${profile.experience}\`\`\``
				)
				.setTimestamp();

			await msg.edit({ embeds: [notifier], components: [] });
		});

		collector?.on('end', async (_collected, reason) => {
			if (reason === 'time') {
				await msg.edit({ content: 'Offer Expired', components: [] });
			}
		});

		return interaction.reply({ content: 'Hello world!' });
	}
}
