import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Amari Bot to Discord: Message travel time'
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
		const msg = await interaction.reply({ content: 'Ping?', fetchReply: true, ephemeral: true });

		const embed = new EmbedBuilder()
			.setAuthor({ name: '/ping', iconURL: interaction.client.user.displayAvatarURL() })
			.setColor('Blurple')
			.setTitle('OH YEAH I\'VE BEEN PINGED')
			.setDescription('Hey there! This is how long it took me to realize you pinged me 😅')
			.setFields(
				{ name: 'Bot Latency:', value: `${this.container.client.ws.ping}ms`, inline: true },
				{ name: 'API Latency:', value: `${msg.createdTimestamp - interaction.createdTimestamp}ms`, inline: true }
			)
			.setTimestamp();

		return await interaction.editReply({
			content: '',
			embeds: [embed],
		});
	}
}
