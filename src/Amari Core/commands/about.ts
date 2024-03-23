import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import { DurationFormatter } from '@sapphire/time-utilities';
import { version } from '../../../package.json';
import { hostname } from 'os';

@ApplyOptions<Command.Options>({
	name: 'about',
	description: 'Learn about VTA Bot',
	requiredClientPermissions: ['SendMessages', 'ViewChannel']
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
		const aboutEmbed = new EmbedBuilder()
			.setAuthor({name: 'About VTA Bot', iconURL: interaction.client.user.displayAvatarURL()})
			.setColor('#e84e4b')
			.setDescription('VTA Bot is an open source Discord Bot focused on providing the community with a variety of features.')
			.setFields([
				{ name: 'Uptime', value: `${new DurationFormatter().format(interaction.client.uptime)}`, inline: true },
				{ name: 'Latency', value: `${interaction.client.ws.ping}ms`, inline: true },
				{ name: 'Version', value: version, inline: true },
				{ name: 'Author', value: 'Github.com/MiekoHikari', inline: true },
				{ name: 'Bot Host', value: `${hostname}`, inline: true},
				{ name: 'Invite the bot', value: `While we are working on a public release of VTA Bot, you can host your own instance by visiting [Github](https://github.com/VTuber-Academy/Amari/wiki#installation)`},
				{ name: 'Help us!', value: 'If you would like to contribute to the project, please visit our [Github](https://github.com/VTuber-Academy/Amari)'}
			])
			.setThumbnail(interaction.client.user.displayAvatarURL())
			.setTimestamp()
		return interaction.reply({ embeds: [aboutEmbed], ephemeral: true });
	}
}
