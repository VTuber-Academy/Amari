import {ApplyOptions} from '@sapphire/decorators';
import {Listener} from '@sapphire/framework';
import {Events, type Message} from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate,
	name: 'LevelUpix MessageCreate',
})
export class UserEvent extends Listener {
	public override run(message: Message) {
		if (!message.guild || message.author.bot) {
			// TODO: Working on it
		}
	}
}
