import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import newMemberMap from './Membership Screening/automatedScreeningInteractionHandler';
import { Message } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate
})
export class UserEvent extends Listener {
	public override run(message: Message) {
		if (newMemberMap.has(message.author.id)) {
			clearTimeout(newMemberMap.get(message.author.id));
		}
	}
}
