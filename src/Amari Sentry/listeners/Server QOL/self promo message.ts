import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { EmbedBuilder, Message } from 'discord.js';
import config from '../../config.json';
import axios from 'axios';
import { name, version } from '../../../../package.json';
import { DateTime } from 'luxon';

const linkCountMap: Map<string, number> = new Map();

@ApplyOptions<Listener.Options>({
	name: 'Self Promotion Listener',
	enabled: true,
	event: Events.MessageCreate
})
export class UserEvent extends Listener {
	public override async run(message: Message) {
		if (message.author.bot) return;

		const staffChannel = await message.guild?.channels.fetch(config.staffNotificationChannel);
		if (!staffChannel || !staffChannel.isTextBased()) return;

		if (message.content.includes('discord.gg/') || message.content.includes('https://')) {
			const count = linkCountMap.get(message.author.id) || 0;
			linkCountMap.set(message.author.id, count + 1);

			if (count >= 3) {
				await message.member?.ban({ reason: 'Excessive link spam', deleteMessageSeconds: 86400000 });

				const warnEmbed = new EmbedBuilder()
					.setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
					.setColor('Red')
					.setTitle('User has been banned!')
					.setDescription('Amari has automatically taken action against this user for excessively spamming links in text channels.')
					.setTimestamp()
					.setThumbnail('https://cdn3.emoji.gg/emojis/BlurpleBanHammer.png');

				await staffChannel.send({ embeds: [warnEmbed] });
			}

			setTimeout(() => {
				linkCountMap.set(message.author.id, (linkCountMap.get(message.author.id) || 0) - 1);
			}, 1000);
		}

		const links: string[] = message.content.match(/https?:\/\/[^\s]+/g) || [];

		if (links.length !== 0) {
			const googleLookup = await axios.post<GoogleLookupResponse>(
				'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' + process.env.googleAPI,
				{
					client: {
						clientId: name,
						clientVersion: version
					},
					threatInfo: {
						threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
						platformTypes: ['ANY_PLATFORM'],
						threatEntryTypes: ['URL'],
						threatEntries: links.map((link) => ({ url: link }))
					}
				}
			);

			const threatReport = new EmbedBuilder()
				.setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
				.setTitle('Link Blocked!')
				.setDescription('Amari has automatically blocked the following link(s) due to potential security threats:')
				.setColor('Yellow')
				.setTimestamp()
				.setFields(
					googleLookup.data.matches.map((match) => ({
						name: match.threat.url,
						value: `\`\`\`Threat Type: ${match.threatType}\nPlatform: ${match.platformType}\`\`\``
					}))
				);

			if (googleLookup.data.matches.length !== 0) {
				await message.delete();
				await message.author.send({ embeds: [threatReport] });
			}

			await staffChannel.send({ embeds: [threatReport] });
		}

		if (message.channelId === config.selfPromoChannel) {
			if (message.content.length! >= 50) {
				await message.delete();
				await message.author
					.send('Your message was deleted because it was too short. Please be more descriptive when promoting your content.')
					.then((msg) => {
						setTimeout(() => {
							msg.delete();
						}, 5000);
					});
			}

			if (DateTime.fromJSDate(message.member?.joinedAt ?? new Date()).diffNow('days').days! < 2) {
				await message.delete();
				await message.author.send('Your message was deleted because you have not been in the server for at least 2 days.').then((msg) => {
					setTimeout(() => {
						msg.delete();
					}, 5000);
				});
			}
		}
	}
}

interface GoogleLookupResponse {
	matches: threatMatches[];
}

interface threatMatches {
	threatType: string;
	platformType: string;
	threatEntryType: string;
	threat: {
		url: string;
	};
	entries: { key: string; value: string }[];
}
