import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { EmbedBuilder, type VoiceState } from 'discord.js';
import { Stopwatch } from '@sapphire/stopwatch';
import { Duration } from '@sapphire/time-utilities';
import levelManager from '../lib/levelManager';
import config from '../config.json';

const trackerMap = new Map<string, Stopwatch>();

@ApplyOptions<Listener.Options>({
	event: Events.VoiceStateUpdate,
	name: 'Level VoiceActivityTracker'
})
export class UserEvent extends Listener {
	public override async run(oldState: VoiceState, newState: VoiceState) {
		if (newState.channelId === config.afkVC) {
			if (!newState.member) return;
			await newState.member.voice.disconnect();

			const notificationEmbed = new EmbedBuilder()
				.setColor('Orange')
				.setTitle('Kicked for AFK!')
				.setDescription("To prevent farming for activity points, AFK for a prolonged period of time isn't permitted!")
				.setTimestamp();

			return newState.member.send({ embeds: [notificationEmbed] });
		}

		if (!oldState.channelId && newState.channelId) {
			if (!newState.member) return;
			trackerMap.set(newState.member.id, new Stopwatch());
		} else if (oldState.channelId && !newState.channelId) {
			if (!oldState.member) return;

			const stopwatch = trackerMap.get(oldState.member.id);
			if (!stopwatch) return;
			stopwatch.stop();

			trackerMap.delete(oldState.member.id);

			const minutes = Math.floor(new Duration(stopwatch.toString()).seconds / 60);

			let xp = 0;

			for (let minute = 0; minute < minutes; minute++) {
				xp += Math.floor(Math.random() * (5 - 2.5 + 1)) + 2.5;
			}

			const msg = await oldState.channel?.send(
				`**${oldState.member.displayName}** has gained **${xp}** XP for being in the voice channel for **${minutes}** minutes!`
			);

			levelManager.addXP(xp, oldState.member.id).then(async (levelled) => {
				if (levelled) {
					await msg?.react('⭐');
				}
			});
		}

		return;
	}
}
