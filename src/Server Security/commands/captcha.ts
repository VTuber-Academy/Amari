import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, type MessageActionRowComponentBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'setup a captcha channel for the server',
	preconditions: ['ownerOnly']
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
		const embed = new EmbedBuilder()
			.setColor('LuminousVividPink')
			.setTitle('Verification Required 🤚')
			.setDescription(
				'In order to protect our members from DM advertisement and raids, this is a necessary precaution. Thank you for understanding!'
			)
			.setTimestamp()
			.setFooter({ text: 'You only need to do this once!' });

		const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			new ButtonBuilder().setCustomId('captcha-verify').setEmoji('🛫').setLabel('I am not a robot').setStyle(ButtonStyle.Primary)
		);

		if (!interaction.channel) return;

		return interaction.channel.send({ embeds: [embed], components: [actionRow] });
	}
}
