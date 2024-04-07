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
	event: Events.GuildMemberUpdate
})
export class UserEvent extends Listener {
	public override async run(oldMember: GuildMember, newMember: GuildMember) {
		if (newMember.roles.cache.has(config.NoConsentRole)) {
			newMember.kick('Removed VTA Bot Information Usage Consent');
		}

		if (oldMember.pending && !newMember.pending) {
			try {
				oldMember.client.logger.debug(`[Sentry] Screening started for [${oldMember.user.username}](${oldMember.user.id})`);
				const screeningResults: ScreeningResults = { isFlagged: false, redFlags: [] };

				const staffChannel = (await newMember.guild.channels.fetch(config.securityGate).catch((err) => {
					throw new Error(`[Sentry] Failed, errored while fetching the staff channel!\n${err}`);
				})) as GuildTextBasedChannel;
				if (!staffChannel) return;

				const tranquilizerRole = await newMember.guild.roles.fetch(config.tranquilizerRole).catch((err) => {
					throw new Error(`[Sentry] Failed, errored while fetching the tranquilizer role!\n${err}`);
				});
				if (!tranquilizerRole) return;

				if (commonEnglishNames.length === 0) {
					commonEnglishNames = (await this.parseNames()) as string[];
				}

				// Convert the array of names into a regex pattern which we will later match
				const generatedUsernameRegex = new RegExp(commonEnglishNames.join('|'), 'i');

				const staffEmbed = new EmbedBuilder()
					.setColor('DarkButNotBlack')
					.setAuthor({ name: newMember.user.username, iconURL: newMember.user.displayAvatarURL() })
					.setThumbnail('https://cdn3.emoji.gg/emojis/4133-bluediscordshield.png')
					.addFields([
						{ name: 'User:', value: `${newMember}`, inline: true },
						{ name: 'Account Age:', value: `<t:${newMember.user.createdTimestamp}:R>`, inline: true }
					])
					.setTimestamp();

				newMember.client.logger.debug(`[Sentry] parsed ${commonEnglishNames.length} names`);
				if (DateTime.fromJSDate(newMember.user.createdAt) > DateTime.now().minus({ months: 6 })) {
					if (DateTime.fromJSDate(newMember.user.createdAt) > DateTime.now().minus({ months: 1 })) {
						screeningResults.isFlagged = true;
						screeningResults.redFlags.push('[❗] Account Age Younger than 1 month');
					} else {
						screeningResults.redFlags.push('[❕] Account Age Younger than 6 months');
					}
				}

				const usernameMatcher = generatedUsernameRegex.exec(newMember.user.username);
				if (usernameMatcher) {
					screeningResults.redFlags.push(`[❗] Username has items from the common english names registry!`);
				}

				newMember.client.logger.debug(`[Sentry] matched ${usernameMatcher} in ${newMember.user.username}`);

				const displayNameMatcher = generatedUsernameRegex.exec(newMember.user.displayName);
				if (displayNameMatcher) {
					screeningResults.redFlags.push(`[❗] Display Name has items from the common english names registry!`);
				}

				newMember.client.logger.debug(`[Sentry] matched ${displayNameMatcher} in ${newMember.user.displayName}`);

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
						file_url: newMember.user.displayAvatarURL({ extension: 'png', size: 128 })
					}
				};

				await axios.request(nsfwProfileAPIoptions).then(
					(response) => {
						if (response.data['eden-ai'].nsfw_likelihood === 5) {
							screeningResults.isFlagged = true;
						} else if (response.data['eden-ai'].nsfw_likelihood > 3) {
							screeningResults.redFlags.push(
								`[❗] Eden detects suggestive profile picture\n- NSFW Likelihood: ${response.data['eden-ai'].nsfw_likelihood} / 5`
							);
						}
					},
					(error) => {
						staffChannel.send(`Cannot scan ${newMember}'s pfp with AI`);
						console.log(error);
					}
				);

				if (!screeningResults.isFlagged && screeningResults.redFlags.length >= 2) {
					screeningResults.isFlagged = true;
				}

				const staffActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId(`screening-approve-${newMember.user.id}`)
						.setLabel(`Let ${newMember.user.username} in!`)
						.setStyle(ButtonStyle.Success)
						.setEmoji('⭐'),
					new ButtonBuilder()
						.setCustomId(`screening-reject-${newMember.user.id}`)
						.setLabel(`Ban ${newMember.user.username}`)
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🔨')
				);

				if (screeningResults.isFlagged) {
					await newMember.roles.add(tranquilizerRole);

					staffEmbed.addFields([{ name: 'Triggers:', value: screeningResults.redFlags.join('\n') }]);
					staffEmbed.setFooter({
						text: 'Waiting for staff input...',
						iconURL: 'https://cdn3.emoji.gg/emojis/4517-warning.png'
					});
				} else {
					staffEmbed.setFooter({
						text: 'User has been approved! 🎉'
					});
				}

				await staffChannel.send({ embeds: [staffEmbed], components: screeningResults.isFlagged ? [staffActionRow] : undefined });
			} catch (error) {
				this.container.logger.error(`[Sentry] failed to screen @${newMember.user.username}[${newMember.user.id}]`);
				this.container.logger.error(error);
			}
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
				this.container.logger.debug(`Finalized and Parsed ${names.length} names`);
				resolve(names);
			});

			stream.on('error', (error: any) => {
				reject(error);
			});
		});
	}
}
