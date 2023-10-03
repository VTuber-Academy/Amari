import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	GuildMember,
	GuildTextBasedChannel,
	MessageActionRowComponentBuilder
} from 'discord.js';
import config from '../../config.json';
import { createReadStream } from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { DateTime } from 'luxon';
import axios from 'axios';

interface ScreeningResults {
	isFlagged: boolean;
	redFlags: string[];
}

interface ExtractedDataFields {
	'Year of Birth': string;
	Gender: string;
	Ethnicity: string;
	"Child's First Name": string;
	Count: string;
	Rank: string;
}

let commonEnglishNames: string[] = [];

@ApplyOptions<Listener.Options>({
	event: Events.GuildMemberAdd
})
export class UserEvent extends Listener {
	public override async run(member: GuildMember) {
		try {
			const screeningResults: ScreeningResults = { isFlagged: false, redFlags: [] };

			const staffChannel = (await member.guild.channels.fetch(config.securityGate).catch(() => {
				throw new Error('Sentry => NO_STAFF_CHANNEL');
			})) as GuildTextBasedChannel;
			if (!staffChannel) return;

			const tranquilizerRole = await member.guild.roles.fetch(config.tranquilizerRole).catch(() => {
				throw new Error('Sentry => NO_ROLE_FOUND');
			});
			if (!tranquilizerRole) return;

			if (commonEnglishNames.length === 0) {
				commonEnglishNames = (await this.parseNames()) as string[];
			}

			const generatedUsernameRegex = new RegExp(commonEnglishNames.join('|'), 'i');

			if (DateTime.fromJSDate(member.user.createdAt) > DateTime.now().minus({ months: 6 })) {
				if (DateTime.fromJSDate(member.user.createdAt) > DateTime.now().minus({ months: 1 })) {
					screeningResults.isFlagged = true;
					screeningResults.redFlags.push('[❗] Account Age Younger than 1 month');
				} else {
					screeningResults.redFlags.push('[❕] Account Age Younger than 6 months');
				}
			}

			const usernameMatcher = generatedUsernameRegex.exec(member.user.username);
			if (usernameMatcher) {
				screeningResults.redFlags.push(
					`[❗] Username has items from the common english names registry!\n- Matches: ${usernameMatcher.join(', ')}`
				);
			}

			const displayNameMatcher = generatedUsernameRegex.exec(member.user.displayName);
			if (displayNameMatcher) {
				screeningResults.redFlags.push(
					`[❗] Display Name has items from the common english names registry!\n- Matches: ${displayNameMatcher.join(', ')}`
				);
			}

			let nsfwProfileAPIoptions = {
				method: 'POST',
				url: 'https://api.edenai.run/v2/image/explicit_content',
				headers: {
					Authorization: `Bearer ${process.env.EdenAI}`
				},
				data: {
					show_original_response: false,
					fallback_providers: '',
					providers: 'api4ai',
					file_url: member.user.displayAvatarURL({ extension: 'png', size: 128 })
				}
			};

			await axios.request(nsfwProfileAPIoptions).then(
				(response) => {
					if (response.data['eden-ai'].nsfw_likelihood === 5) {
						screeningResults.isFlagged = true;
					} else if (response.data['eden-ai'].nsfw_likelihood > 3) {
						screeningResults.redFlags.push('[❗] Eden detects suggestive profile picture');
					}
				},
				(error) => {
					staffChannel.send(`Cannot scan ${member}'s pfp with AI`);
					console.log(error);
				}
			);

			let nsfwBannerAPIoptions = {
				method: 'POST',
				url: 'https://api.edenai.run/v2/image/explicit_content',
				headers: {
					Authorization: `Bearer ${process.env.EdenAI}`
				},
				data: {
					show_original_response: false,
					fallback_providers: '',
					providers: 'api4ai',
					file_url: member.user.bannerURL({ extension: 'png', size: 128 })
				}
			};

			await axios.request(nsfwBannerAPIoptions).then(
				(response) => {
					if (response.data['eden-ai'].nsfw_likelihood === 5) {
						screeningResults.isFlagged = true;
					} else if (response.data['eden-ai'].nsfw_likelihood > 3) {
						screeningResults.redFlags.push('[❗] Eden detects suggestive banner picture');
					}
				},
				(error) => {
					staffChannel.send(`Cannot scan ${member}'s banner with AI`);
					console.log(error);
				}
			);

			if (!screeningResults.isFlagged && screeningResults.redFlags.length >= 2) {
				screeningResults.isFlagged = true;
			}

			if (screeningResults.isFlagged) {
				const flaggedEmbed = new EmbedBuilder()
					.setColor('DarkRed')
					.setTitle('Sorry for the Delay!')
					.setDescription(
						"This is Amari speaking, codenamed VTA-Bot.\n\nAmari watches over members within the discord server and is excited to welcome you! It seems that your profile has triggered a few safety traps coded within me but don't fret! A staff has been notified to manually review you! If you still can't access the server after a few days of waiting, please contact <@575252669443211264>. \n\nSee you soon!"
					)
					.addFields({ name: 'Reasons', value: screeningResults.redFlags.join('\n') })
					.setTimestamp()
					.setThumbnail('https://cdn.discordapp.com/emojis/805667882968547340.webp?size=256'); // Alybonk emoji :3

				let notified: boolean = false;
				await member.roles.add(tranquilizerRole);
				await member.send({ embeds: [flaggedEmbed] }).then(
					() => (notified = true),
					() => (notified = false)
				);
				flaggedEmbed.setFooter({ text: notified ? 'DM Sent successfully' : 'Could not contact member' });

				flaggedEmbed
					.setTitle('Member has been flagged!')
					.setDescription('Amari flagged a member! Please respond to this ASAP to maintain good relations with said member!')
					.addFields({ name: 'Flagged Member', value: `${member}` });

				const staffActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId(`screening-approve-${member.user.id}`)
						.setLabel(`Approve ${member.displayName}`)
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId(`screening-reject-${member.user.id}`)
						.setLabel(`Reject ${member.displayName}`)
						.setStyle(ButtonStyle.Danger)
				);

				await staffChannel.send({ embeds: [flaggedEmbed], components: [staffActionRow] });
			} else {
				const acceptedEmbed = new EmbedBuilder()
					.setColor('Green')
					.setTitle('Welcome to the VTA!')
					.setDescription(
						'This is Amari speaking, codenamed VTA-Bot.\n\nAmari watches over members within the discord server and is excited to welcome you! You have passed our automated safety checks and now you are welcome to freely chat in our server! If you have any questions, contact <@575252669443211264> and a human will be there with you shorty.\n\nSee you soon!'
					)
					.setTimestamp();

				await member.send({ embeds: [acceptedEmbed] }).catch(() => null); // Ignore failure, welcome messages are often ignored anyways :c

				acceptedEmbed.setDescription(`${member} has passed all automated checks and was allowed to enter the VTA!`);
				await staffChannel.send({ embeds: [acceptedEmbed] });
			}
		} catch (error) {
			this.container.logger.error(`[Sentry] failed to screen @${member.user.username}[${member.user.id}]`);
			this.container.logger.error(error);
		}
	}

	private async parseNames() {
		return new Promise((resolve, reject) => {
			const names: string[] = [];
			const stream = createReadStream(path.join(__dirname, '../../lib/CommonEnglishNames.csv')).pipe(csvParser());

			stream.on('data', (row: ExtractedDataFields) => {
				if (row["Child's First Name"]) {
					names.push(row["Child's First Name"]);
				}
			});

			stream.on('end', () => {
				this.container.logger.info(`Finalized and Parsed ${names.length} names`);
				resolve(names);
			});

			stream.on('error', (error: any) => {
				reject(error);
			});
		});
	}
}
