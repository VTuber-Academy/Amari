import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';

@ApplyOptions<Subcommand.Options>({
	description: 'Developer Utilities',
	preconditions: ['ownerOnly'],
	subcommands: [
		{
			name: 'clear',
			chatInputRun: 'clearCommands'
		}
	]
})
export class UserCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((command) => command.setName('clear').setDescription('Clear redundant commands'))
		);
	}

	public async clearCommands(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.client.application.commands.set([]);

		await interaction.reply('Cleared all commands and now restarting the bot!');

		return setTimeout(function () {
			// Listen for the 'exit' event.
			// This is emitted when our app exits.
			process.on('exit', function () {
				//  Resolve the `child_process` module, and `spawn`
				//  a new process.
				//  The `child_process` module lets us
				//  access OS functionalities by running any bash command.`.
				require('child_process').spawn(process.argv.shift(), process.argv, {
					cwd: process.cwd(),
					detached: true,
					stdio: 'inherit'
				});
			});
			process.exit();
		}, 1000);
	}
}
