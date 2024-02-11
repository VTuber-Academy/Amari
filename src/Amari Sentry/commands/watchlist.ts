import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import watchlistDatabase from '../lib/sentryWatchlist';

@ApplyOptions<Subcommand.Options>({
	description: 'watchlist commands',
	requiredUserPermissions: ['ModerateMembers'],
	subcommands: [
		{
			name: 'add',
			chatInputRun: 'add'
		},
		{
			name: 'remove',
			chatInputRun: 'remove'
		},
		{
			name: 'list',
			chatInputRun: 'list'
		}
	]
})
export class UserCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('add')
						.setDescription('Add a user to the watchlist')
						.addStringOption((option) => option.setName('userid').setDescription('The user to add to the watchlist').setRequired(true))
						.addStringOption((option) =>
							option.setName('reason').setDescription('The reason for adding the user to the watchlist').setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('remove')
						.setDescription('Remove a user from the watchlist')
						.addStringOption((option) =>
							option.setName('userid').setDescription('The user to remove from the watchlist').setRequired(true)
						)
				)
				.addSubcommand((subcommand) => subcommand.setName('list').setDescription('All users in the watchlist'))
		);
	}

	public async add(interaction: Subcommand.ChatInputCommandInteraction) {
		const userID = interaction.options.getString('userid', true);
		const reason = interaction.options.getString('reason', true);

		let dbUser = await watchlistDatabase.findOne({ discordId: userID });

		if (dbUser) {
			interaction.reply({ content: 'User is already in the watchlist!', ephemeral: true });
			return;
		} else {
			dbUser = new watchlistDatabase({ discordId: userID, reason: reason });
			dbUser.save();

			interaction.reply({ content: 'User added to the watchlist!', ephemeral: true });
			return;
		}
	}

	public async remove(interaction: Subcommand.ChatInputCommandInteraction) {
		const userID = interaction.options.getString('userid', true);

		const dbUser = await watchlistDatabase.findOne({ discordId: userID });

		if (!dbUser) {
			interaction.reply({ content: 'User is not in the watchlist!', ephemeral: true });
			return;
		} else {
			dbUser.deleteOne();

			interaction.reply({ content: 'User removed from the watchlist!', ephemeral: true });
			return;
		}
	}

	public async list(interaction: Subcommand.ChatInputCommandInteraction) {
		const dbUsers = await watchlistDatabase.find();

		if (dbUsers.length === 0) {
			interaction.reply({ content: 'The watchlist is empty!', ephemeral: true });
			return;
		} else {
			const users = dbUsers.map((user) => `\`${user.discordId} - ${user.reason}\``);

			interaction.reply({ content: `Users in the watchlist:\n${users.join('\n')}`, ephemeral: true });
			return;
		}
	}
}
