// TODO: Track how long that member has been in a voice channel for
// TODO: Calculate how many times the cooldown would've been finished
// TODO: Reward 5 xp for every minute passed in the VC
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import type { VoiceState } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: Events.VoiceStateUpdate,
	name: 'Level VoiceActivityTracker'
})
export class UserEvent extends Listener {
	public override async run(oldState: VoiceState, newState: VoiceState) {
		if (!oldState && newState) {
			// User joined channel
		} else if (oldState && newState) {
			// User moved channel
		} else if (oldState && !newState) {
			// User left channel
		}
	}
}
