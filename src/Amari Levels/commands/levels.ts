import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import levelDatabase from '../lib/levelDataBase';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable, EmbedBuilder, MessageActionRowComponentBuilder, MessageComponentInteraction } from 'discord.js';
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
			name: 'modify',
			chatInputRun: 'modifyCommand'
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
						.setName('modify')
						.setDescription('Make changes to a member\'s level and experience')
						.addUserOption((input) => input.setName('target').setDescription('The user that is going get the change').setRequired(true))
						.addIntegerOption((input) =>
							input.setName('level').setDescription('level to set on the member').setMinValue(0)
						)
						.addIntegerOption((input) => input.setName('experience').setDescription('experience to set on the member').setMinValue(0))
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

		const hexColor: ColorResolvable = interaction.options.getString('hex-color', true) as ColorResolvable;

		// validate if member has a rolereward role
		config.roleRewards.forEach(async (role, i) => {
			if (i === 3) return;
			const roleReward = await interaction.guild?.roles.fetch(role);
			if (!roleReward) return;

			if (roleReward.members.find((member) => member.id === interaction.user.id)) {
				return roleReward
					.setColor(hexColor)
					.catch(() => {
						return interaction.editReply({ content: 'Color not supported!' });
					})
					.then(() => {
						return interaction.editReply({ content: 'Your role color has been updated!' });
					});
			}

			return interaction.editReply({ content: "You don't have a role reward role!" });
		});
	}

	public async finalizeCycle(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		// Check for permissions
		if (!interaction.memberPermissions?.has('Administrator'))
			return interaction.editReply({ content: "You don't have permissions to run this command >:C" });

		// All users ranked highest to lowest
		const allUsers = await levelDatabase
			.find({})
			.sort({ level: -1, experience: -1 })
			.catch(() => []);

		const topThree = allUsers.slice(0, 3);

		const activeRole = await interaction.guild?.roles.fetch(config.roleRewards[3]);
		if (!activeRole) return interaction.channel?.send(`Can't find active role ${config.roleRewards[3]}`);

		// Reset active role
		activeRole.members.forEach(async (member) => {
			await member.roles.remove(activeRole);
		});

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
				`Congratulations! In the last period, you ranked [#${i + 1
				}] within the VTA in terms of activity!\n\nYou now have access to /level role to customize your appearance within the server!`
			);

			// Add role
			return discordMember.roles.add([rewardRole, activeRole], 'Level Cycle Finalized!');
		});

		// Clear the database
		await levelDatabase.deleteMany({});

		// Finalize the interaction
		return interaction.editReply({ content: 'Finalized the level cycle!' });
	}

	public async modifyCommand(interaction: Subcommand.ChatInputCommandInteraction) {
		if (!interaction.memberPermissions?.has('ManageRoles'))
			return interaction.reply({ content: 'You need to be able to `Manage Roles` in order to modify a member\'s levels!', ephemeral: true });

		const target = interaction.options.getUser('target', true);
		const level = interaction.options.getInteger('level', false);
		const experience = interaction.options.getInteger('experience', false);

		if (!level && !experience)
			return interaction.reply({ content: 'You need to provide a level or experience to modify!', ephemeral: true });

		let profile = await levelDatabase.findOne({ id: target.id });

		if (!profile) {
			profile = new levelDatabase({
				id: target.id,
				level: 0,
				experience: 0
			});
		}

		const warningEmbed = new EmbedBuilder()
			.setColor('Yellow')
			.setTitle(`Warning! ⚠️`)
			.setDescription(`${target.username} will be notified of the changes. Are you sure you want to proceed?\n\nCommand:\n Set-Level: ${level ?? profile.level}\nExperience: ${experience ?? profile.experience}`)
			.setTimestamp();

		const warningRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(new ButtonBuilder().setCustomId('confirm-modify').setEmoji('✅').setLabel('Continue').setStyle(ButtonStyle.Danger));

		const msg = await interaction.reply({ embeds: [warningEmbed], components: [warningRow] });

		const filter = (i: MessageComponentInteraction) => i.customId === 'confirm-modify' && i.user.id === interaction.user.id;

		const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 30000 });

		collector?.on('collect', async () => {
			if (!profile) return;

			if (level) profile.level = level;
			if (experience) profile.experience = experience;

			profile.lastActivity = new Date();

			await profile.save();

			warningEmbed.setColor('Green').setTitle('Success! ✅').setDescription(`${target.username} has been modified!`);
			await msg.edit({ embeds: [warningEmbed], components: [] });

			const notifier = new EmbedBuilder()
				.setColor('Green')
				.setTitle(`Your Level has been modified!`)
				.setDescription(`${interaction.user.username} has modified your level to: \n\`\`\`Level: ${profile.level}\nExperience: ${profile.experience}\`\`\``)
				.setTimestamp();

			await target.send({
				embeds: [notifier]
			});
		});

		collector?.on('end', async (_collected, reason) => {
			if (reason === 'time') {
				await msg.edit({ content: 'Offer Expired', components: [] });
			}
		});

		return;
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
