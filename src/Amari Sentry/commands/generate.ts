import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { AttachmentBuilder, ChannelType, EmbedBuilder, ForumChannel } from 'discord.js';

@ApplyOptions<Subcommand.Options>({
	description: 'generate embeds!',
	requiredUserPermissions: ['ManageMessages'],
	subcommands: [
		{
			name: 'faq',
			chatInputRun: 'faqEmbed'
		},
		{
			name: 'logs',
			chatInputRun: 'ThreadPostLogging'
		}
	]
})
export class UserCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((command) =>
					command
						.setName('faq')
						.setDescription('Generate FAQ embeds for the FAQ Channel!')
						.addStringOption((option) => option.setName('question').setDescription('What is frequently asked').setRequired(true))
						.addStringOption((option) => option.setName('answer').setDescription('What is the same answer').setRequired(true))
				)
				.addSubcommand((command) =>
					command
						.setName('logs')
						.setDescription('Log a discord thread')
						.addChannelOption((channel) =>
							channel
								.addChannelTypes(ChannelType.GuildForum)
								.setName('forum')
								.setDescription('the forum channel it took place in')
								.setRequired(true)
						)
						.addStringOption((option) =>
							option.setName('threadid').setDescription('the id of the thread it took place in').setRequired(true)
						)
				)
		);
	}

	public async faqEmbed(interaction: Subcommand.ChatInputCommandInteraction) {
		const embedTemplate = new EmbedBuilder()
			.setColor('#e94d51')
			.setTitle(`Q: ${interaction.options.getString('question', true)}`)
			.setDescription(`A: ${interaction.options.getString('answer', true)}`)
			.setTimestamp();

		await interaction.channel?.send({
			embeds: [embedTemplate]
		});

		return interaction.reply({ content: 'Embed Sent Successfully!', ephemeral: true });
	}

	public async ThreadPostLogging(interaction: Subcommand.ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel('forum', true) as ForumChannel;
		const threadID = interaction.options.getString('threadid', true);

		const thread = await channel.threads.fetch(threadID);
		if (!thread) return;

		const messages = await thread.messages.fetch({ after: `${thread.createdTimestamp}` });

		const logs = [] as string[];
		messages.forEach((message) => {
			logs.push(`[@${message.author.username}] [${message.createdTimestamp}] ${message.content}`);

			message.attachments.forEach((attachment) => {
				logs.push(`[@${message.author.username}] [${message.createdTimestamp}] ATTACHMENT: ${attachment.contentType} - ${attachment.url}`);
			});
		});

		const attachment = new AttachmentBuilder(Buffer.from(logs.join('\n')), {
			name: `${threadID} logs.txt`
		});

		return interaction.reply({
			content: 'Channel has been logged',
			files: [attachment]
		});
	}
}
