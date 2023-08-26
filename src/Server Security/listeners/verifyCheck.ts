import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import config from '../config.json';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate
})
export class UserEvent extends Listener {
	public override async run(message: Message) {
		if (!message.member?.roles.cache.has(config.verifiedRole)) {
			await message.delete();
			return message.member?.send(`Please verify yourself in <#1144523135585095700> before sending a message in the server`);
		} else {
			return;
		}
	}
}
