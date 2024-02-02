import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import version from '../../listeners/ready';

@ApplyOptions<Command.Options>({
	description: 'Current Amari Version'
})
export class UserCommand extends Command {
	// Register slash and context menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register slash command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	// slash command
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const embed = new EmbedBuilder()
			.setAuthor({ name: '/version', iconURL: interaction.client.user.displayAvatarURL() })
			.setColor('Blurple')
			.setTitle(`Amari running on ${version}`)
			.setDescription('Tracked from https://github.com/VTuber-Academy/Amari')
			.setThumbnail('https://cdn3.emoji.gg/emojis/2800-kannaupvote.png')
			.setTimestamp();

		return await interaction.reply({ embeds: [embed], ephemeral: true });
	}
}
