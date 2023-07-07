import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { Duration } from '@sapphire/duration';
import config from '../levelConfig.json';
import levelManager from '../lib/levelManager';

const cooldownMap = new Map<string, number>();

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate,
	name: 'Level MessageCreate'
})
export class UserEvent extends Listener {
	public override async run(message: Message) {
		if (cooldownMap.has(message.author.id)) return;
		if (config.IgnoreChannels.find((id) => id === message.channelId)) return;

		const xp = Math.floor(Math.random() * (30 - 15 + 1)) + 15;
		await levelManager.addXP(xp, message.author.id).then(async (levelled) => {
			if (levelled) {
				await message.react('⭐');
			}
		});

		cooldownMap.set(message.author.id, Date.now());
		setTimeout(() => {
			cooldownMap.delete(message.author.id);
		}, new Duration('1m').offset);
	}
}
