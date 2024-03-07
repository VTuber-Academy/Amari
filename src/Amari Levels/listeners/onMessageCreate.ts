import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { ChannelType, MessageType, type Message } from 'discord.js';
import { Duration } from '@sapphire/duration';
import config from '../config.json';
import levelManager from '../lib/levelManager';

const cooldownMap = new Map<string, number>();

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate,
	name: 'Level MessageCreate'
})
export class UserEvent extends Listener {
	public override async run(message: Message) {
		if (
			message.channel.type === ChannelType.DM ||
			cooldownMap.has(message.author.id) ||
			message.author.bot ||
			config.IgnoreChannels.find((id) => id === message.channelId) ||
			message.type !== MessageType.Default
		)
			return;

		const xp = Math.floor(Math.random() * 16) + 15;
		await levelManager.addXP(xp, message.author.id).then(async (levelled) => {
			if (levelled) {
				await message.react('⭐').catch((err) => message.client.logger.error(err));
			}
		});

		cooldownMap.set(message.author.id, Date.now());
		setTimeout(() => {
			cooldownMap.delete(message.author.id);
		}, new Duration(config.messageCooldown).offset);
	}
}
