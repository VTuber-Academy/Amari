// TODO: /levels rank (of: user)
// TODO: /levels leaderboard (of: VTubers | Members | All)
// TODO: /levels give-level [to: User] [an amount of: level]
// TODO: /levels remove-level [from: User] [an amount of: level]

import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import levelDatabase from '../lib/levelDataBase';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import levelManager from '../lib/levelManager';
import { Rank } from 'canvacord';

@ApplyOptions<Subcommand.Options>({
	name: 'Levels',
	description: 'All Level related commands',
	cooldownDelay: 5000,
	subcommands: [
		{
			name: 'rank',
			chatInputRun: 'rankCommand'
		},
		{
			name: 'leaderboard',
			chatInputRun: 'leaderboardCommand'
		},
		{
			name: 'add',
			chatInputRun: 'addCommand'
		},
		{
			name: 'remove',
			chatInputRun: 'removeCommand'
		}
	]
})
export class UserCommand extends Subcommand {
	// Register slash and context menu command
	registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('level')
				.setDescription('All level related commands') // Needed even though base command isn't displayed to end user
				.addSubcommand((command) =>
					command
						.setName('add')
						.setDescription('Give members level and reset their XPs to 0')
						.addIntegerOption((input) =>
							input.setName('levels').setDescription('Amount of levels to add').setMinValue(1).setRequired(true)
						)
						.addUserOption((input) => input.setName('to').setDescription('The user that is going to gain levels').setRequired(true))
				)
				.addSubcommand((command) =>
					command
						.setName('remove')
						.setDescription('Remove members level and reset their XPs to 0')
						.addIntegerOption((input) =>
							input.setName('levels').setDescription('Amount of levels to remove').setMinValue(1).setRequired(true)
						)
						.addUserOption((input) => input.setName('from').setDescription('The user that is going to gain levels').setRequired(true))
				)
				.addSubcommand((command) =>
					command
						.setName('leaderboard')
						.setDescription("Ladders of every member's activity")
						.addStringOption((input) =>
							input
								.setName('of')
								.setDescription("Category of member's activities")
								.setChoices({ name: 'VTuber', value: 'VTuber' }, { name: 'Members', value: 'Members' }, { name: 'All', value: 'All' })
						)
				)
				.addSubcommand((command) =>
					command
						.setName('rank')
						.setDescription("View a member's level rank")
						.addUserOption((input) => input.setName('of').setDescription('The member to be audited'))
				)
		);
	}

	public async addCommand(interaction: Subcommand.ChatInputCommandInteraction) {
		if (!interaction.memberPermissions?.has('ManageRoles'))
			return interaction.reply({ content: 'Chu need teh manage roles purrmission (╯°□°)╯︵ ┻━┻' });

		const rewarded = interaction.options.getUser('to', true);
		let profile = await levelDatabase.findOne({ id: rewarded.id });

		if (!profile) {
			profile = new levelDatabase({
				id: rewarded.id,
				level: 0,
				experience: 0
			});
		}

		const levelsToAdd = interaction.options.getInteger('levels', true);
		profile.level += levelsToAdd;
		profile.experience = 0;
		profile.lastActivity = new Date();

		await profile.save();

		const notifier = new EmbedBuilder()
			.setColor('Green')
			.setTitle(`${levelsToAdd} levels rewarded to ${rewarded.username}`)
			.setDescription(`From: ${interaction.user.username}`)
			.setFooter({ text: `You are now level ${profile.level}` })
			.setTimestamp();

		await rewarded.send({
			content: 'Buzz! New Notification!',
			embeds: [notifier]
		});

		return interaction.reply({
			content: `${rewarded.username} has been notified!`,
			embeds: [notifier],
			ephemeral: true
		});
	}

	public async removeCommand(interaction: Subcommand.ChatInputCommandInteraction) {
		if (!interaction.memberPermissions?.has('ManageRoles'))
			return interaction.reply({ content: 'Chu need teh manage roles purrmission (╯°□°)╯︵ ┻━┻', ephemeral: true });

		const deducted = interaction.options.getUser('from', true);
		let profile = await levelDatabase.findOne({ id: deducted.id });

		if (!profile) {
			return interaction.reply({
				content: `${deducted.username} has never meowed in the server before (╯°□°)╯︵ ┻━┻`,
				ephemeral: true
			});
		}

		const levelsToRemove = interaction.options.getInteger('levels', true);
		profile.level -= levelsToRemove;
		profile.experience = 0;
		profile.lastActivity = new Date();

		if (profile.level < 0) profile.level = 0;

		await profile.save();

		const notifier = new EmbedBuilder()
			.setColor('Orange')
			.setTitle(`${levelsToRemove} levels deducted from ${deducted.username}`)
			.setDescription(`By: ${interaction.user.username}`)
			.setFooter({ text: `You are now level ${profile.level}` })
			.setTimestamp();

		await deducted.send({
			content: 'Buzz! New Notification!',
			embeds: [notifier]
		});

		return interaction.reply({
			content: `${deducted.username} has been notified!`,
			embeds: [notifier],
			ephemeral: true
		});
	}

	public async rankCommand(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		const targetUser = interaction.options.getUser('of') ?? interaction.user;
		const targetProfile = await levelDatabase.findOne({ id: targetUser.id });

		if (!targetProfile) {
			return interaction.editReply(`${targetUser} has never meowed in the server before! (╯°□°)╯︵ ┻━┻`);
		}

		// TODO Align Level and experience to the right
		// TODO Make profile picture a tad bit smaller

		const card = new Rank()
			.setAvatar(targetUser.displayAvatarURL())
			.setCurrentXP(targetProfile.experience, '#333333')
			.setLevel(targetProfile.level)
			.setLevelColor('#FFFFFf')
			.setRank(0, '', false)
			.setProgressBar(['#D84549', '#F18B8F'], 'GRADIENT', true)
			.setBackground('COLOR', '#E94D51')
			.setRequiredXP(levelManager.calculateNextLevelXP(targetProfile.level), '#B53E40')
			.setUsername(targetUser.username);

		return card.build().then(async (data) => {
			const attachment = new AttachmentBuilder(data, {
				name: `RC-${targetUser.username}-${Date.now()}.png`,
				description: `${targetUser.username}'s Rank card generated on ${new Date()}`
			});

			return interaction.editReply({
				files: [attachment]
			});
		});
	}
}
