import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import levelDatabase from '../lib/levelDataBase';
import { ColorResolvable, EmbedBuilder } from 'discord.js';
import levelManager from '../lib/levelManager';
import config from '../config.json';

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
		},
		{
			name: 'clearempty',
			chatInputRun: 'clearEmpty'
		},
		{
			name: 'finalize',
			chatInputRun: 'finalizeCycle'
		},
		{
			name: 'role',
			chatInputRun: 'roleCommand'
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
				.addSubcommand((command) => command.setName('leaderboard').setDescription("Ladders of every member's activity"))
				.addSubcommand((command) =>
					command
						.setName('rank')
						.setDescription("View a member's level rank")
						.addUserOption((input) => input.setName('of').setDescription('The member to be audited'))
				)
				.addSubcommand((command) => command.setName('clearempty').setDescription('Clear members that are not in the server manually!'))
				.addSubcommand((command) => command.setName('finalize').setDescription('Finalize the current level cycle period!'))
				.addSubcommand((command) =>
					command
						.setName('role')
						.setDescription('Customize the color of your name in the server!')
						.addStringOption((option) =>
							option.setName('hex-color').setDescription('The color you want your name to be! IN HEX!').setRequired(true)
						)
				)
		);
	}

	public async roleCommand(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		const hexColor: string = interaction.options.getString('hex-color', true);

		// check if hexColor is colorresolvable
		let color: ColorResolvable;

		try {
			color = hexColor as ColorResolvable;
		} catch (err) {
			return interaction.editReply({ content: 'Color not supported!' });
		}

		// validate if member has a rolereward role
		config.roleRewards.forEach(async (role) => {
			const roleReward = await interaction.guild?.roles.fetch(role);
			if (!roleReward) return;

			if (roleReward.members.find((member) => member.id === interaction.user.id)) {
				await roleReward.setColor(color);
				return interaction.editReply({ content: 'Your role color has been updated!' });
			}

			return interaction.editReply({ content: "You don't have a role reward role!" });
		});
	}

	public async finalizeCycle(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		// Check for permissions
		if (!interaction.memberPermissions?.has('Administrator'))
			return interaction.reply({ content: "You don't have permissions to run this command >:C", ephemeral: true });

		// All users ranked highest to lowest
		const allUsers = await levelDatabase
			.find({})
			.sort({ level: -1, experience: -1 })
			.catch(() => []);

		const topThree = allUsers.slice(0, 3);

		topThree.forEach(async (member, i) => {
			// Fetch all required info from discord
			const discordMember = await interaction.guild?.members.fetch(member.id);
			if (!discordMember) return interaction.channel?.send(`Can't find ${member.id} within the server`);

			const rewardRole = await interaction.guild?.roles.fetch(config.roleRewards[i]);
			if (!rewardRole) return interaction.channel?.send(`Can't find reward role ${config.roleRewards[i]}`);

			// Reset role
			rewardRole.members.forEach(async (member) => {
				await member.roles.remove(rewardRole);
			});
			await rewardRole.setColor('Default');

			await discordMember.send(
				`Congratulations! In the last period, you ranked [#${
					i + 1
				}] within the VTA in terms of activity!\n\nYou now have access to /level role to customize your appearance within the server!`
			);

			// Add role
			return discordMember.roles.add(rewardRole);
		});

		// Clear the database
		await levelDatabase.deleteMany({});

		// Finalize the interaction
		return interaction.editReply({ content: 'Finalized the level cycle!' });
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

		const emojibar: string[] = [];
		const percentageToLevelUp = targetProfile.experience / levelManager.calculateNextLevelXP(targetProfile.level);

		const barLength = 10;
		const filledCount = Math.floor(percentageToLevelUp * barLength);

		for (let i = 0; i < barLength; i++) {
			if (i === 0) {
				emojibar.push(filledCount > 0 ? '<:barstartfill:1169144871530004480>' : '<:barstartempty:1169144868136828929>');
			} else if (i === barLength - 1) {
				emojibar.push(filledCount >= barLength ? '<:barendfill:1169144857814650962>' : '<:barendempty:1169144854362718278>');
			} else if (i < filledCount) {
				emojibar.push('<:barmiddlefill:1169144859882426510>');
			} else {
				emojibar.push('<:barmiddleempty:1169144863908970556>');
			}
		}

		const card = new EmbedBuilder()
			.setColor('Green')
			.setTitle(
				`✨   Level ${targetProfile.level}  «  [${targetProfile.experience} / ${levelManager.calculateNextLevelXP(targetProfile.level)}]   ⭐`
			)
			.setDescription(`### ${emojibar.join('')}`)
			.setTimestamp()
			.setThumbnail('https://cdn3.emoji.gg/emojis/1835-pixelpaws.png')
			.setAuthor({ iconURL: targetUser.displayAvatarURL(), name: targetUser.username });

		return interaction.editReply({ embeds: [card] });
	}

	public async leaderboardCommand(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		const leaderboardEmbed = new EmbedBuilder()
			.setColor('Aqua')
			.setTitle('**Top 10 Active Members!**')
			.setFooter({ text: 'Talk in the server to get a ranking!' });

		const allUsers = await levelDatabase
			.find({})
			.sort({ level: -1, experience: -1 })
			.catch(() => []);

		if (allUsers.length === 0)
			leaderboardEmbed.setDescription('No Data Available! This usually happens when the code errored out or no one has talked in the server!');

		const memberRanking = allUsers.findIndex((member) => member.id === interaction.user.id) + 1;
		if (memberRanking !== 0) leaderboardEmbed.setFooter({ text: `You rank #${memberRanking}!` });

		const topTen = allUsers.slice(0, 10);
		leaderboardEmbed.setDescription(
			topTen.map((member, index) => `#${index + 1} - <@${member.id}> - Level: ${member.level} Exp: ${member.experience}`).join('\n')
		);

		return interaction.editReply({
			embeds: [leaderboardEmbed]
		});
	}

	public async clearEmpty(interaction: Subcommand.ChatInputCommandInteraction) {
		if (!interaction.memberPermissions?.has('Administrator'))
			return interaction.reply({ content: 'you must be admin to use this cmd!', ephemeral: true });
		await interaction.deferReply();

		let deleted = 0;

		(await levelDatabase.find({})).forEach(async (levelDb) => {
			await interaction.guild?.members.fetch(levelDb.id).catch(() => {
				levelDb.deleteOne();
				deleted += 1;
			});
		});

		return interaction.reply({ content: `Cleared ${deleted} database members!` });
	}
}
