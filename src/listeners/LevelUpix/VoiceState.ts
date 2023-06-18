import {ApplyOptions} from '@sapphire/decorators';
import {Listener} from '@sapphire/framework';
import {Events, type VoiceState} from 'discord.js';
import {Stopwatch} from '@sapphire/stopwatch';

const trackerMap = new Map<string, Stopwatch>();

@ApplyOptions<Listener.Options>({
	event: Events.VoiceStateUpdate,
	name: 'LevelUpix VoiceStateUpdate',
})
export class UserEvent extends Listener {
	public override run(oldState: VoiceState, newState: VoiceState) {
		if (newState.member?.user.bot ?? !newState.member) {
			return;
		}

		// Assume that the user joined the new channel
		if (!oldState.channel && newState.channel) {
			const stopwatch = new Stopwatch();
			trackerMap.set(newState.member.id, stopwatch);
		}

		// Assume that the user left voice channel
		else if (oldState.channel && !newState.channel) {
			const stopwatch = trackerMap.get(newState.member.id);
			// TODO: Do something with elapsedTime
			const elapsedTime = stopwatch?.stop();
			console.log(elapsedTime);

			trackerMap.delete(newState.member.id);
		}
	}
}
