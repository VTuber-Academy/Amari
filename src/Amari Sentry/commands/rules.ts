import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Generate an embed containing serverwide rules',
	requiredUserPermissions: ['ManageMessages']
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
		await interaction.deferReply({ ephemeral: true });

		const welcomeEmbed = new EmbedBuilder()
			.setColor('#fc5b5b')
			.setTitle('We welcome you to the VTA!')
			.setDescription(
				'We are excited to see you in action but before that, you need to be aware of the rules that helps everyone show their good side!'
			)
			.addFields(
				{ name: 'We, as a community follow the Discord Community Guidelines', value: 'https://discord.com/guidelines', inline: false },
				{ name: 'By using Discord, you agree to the following terms and conditions', value: 'https://discord.com/terms', inline: false }
			);

		const infombed = new EmbedBuilder()
			.setColor('#fcde5b')
			.setTitle('Rules')
			.setDescription(
				'Our moderators are fairly merciful so if you fail to comply, you only get a "strike". 3 strikes and you\'re "flagged" until the staffs decide on what to do with you.\n\nIncase you are banned or flagged indefinitely, you may send a DM to <@575252669443211264> or contact us through [twitter](https://x.com/vtuberacademy)!'
			)
			.addFields(
				{
					name: '⭕   Server Profiles',
					value: '```Not-Safe-For-Work usernames, nicknames, display names, banners and profile pictures are prohibited. Malicious Links in your connections and about me is prohibited.\n\nYou may be flagged until you update your profile.```'
				},
				{
					name: '⭕   Texting Policy',
					value: "```- Try to maintain channel relevancy.\n- Avoid Spamming\n- Deep Talks such as political, religious talks are prohibited. (NSFW Too!)\n- Avoid drama as much as possible\n- We recommend speaking in english as much as possible\n- Everyone must be respected (Have common sense, don't dox ty <3)```",
					inline: false
				},
				{
					name: '⭕   Voice and DMs',
					value: '```Texting Policy applies in voice channels. Sufficient evidence must be provided for a voice report to be validated.\n\nText policies apply in DMs ONLY IF the two members have never interacted before.```'
				},
				{
					name: '⭕   Our take on promotion',
					value: '```DM Advertisement is not an effective solution for promotion and we encourage making connections and building a spider web! DM Advertisement is hereby a bannable offense if member has no activity on the server.```'
				}
			);

		const closingEmbed = new EmbedBuilder()
			.setColor('#7cfc65')
			.setTitle('We really hope you enjoy your stay')
			.setDescription('You can now start exploring other channels available to you! Remember to <#1149899343684456548>!')
			.setTimestamp()
			.setFooter({ text: 'Rules last updated on:' });

		await interaction.channel?.send({ embeds: [welcomeEmbed, infombed, closingEmbed] });

		return interaction.editReply({ content: 'Command Complete' });
	}
}
