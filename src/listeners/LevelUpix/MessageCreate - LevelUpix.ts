import {ApplyOptions} from '@sapphire/decorators';
import {Listener} from '@sapphire/framework';
import {Events, type Message} from 'discord.js';
import levelManager from '../../lib/events/AmariLevel';
import {settingsDatabase} from '../../lib/events/Database';
import {evaluate} from 'mathjs';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate,
	name: 'LevelUpix MessageCreate',
})
export class UserEvent extends Listener {
	public override async run(message: Message) {
		if (message.guild && !message.author.bot) {
			const {reward} = (await settingsDatabase.get(message.guild.id)).amariLevel.message;

			const rewards = Number(evaluate(reward, {$contentLength$: message.content.length}));
			const levelUp = await levelManager.modifyMessageLevel(message.author.id, message.guild.id, rewards);
			message.client.logger.debug(`Rewarded ${rewards} points to @${message.author.username}!`);

			if (levelUp) {
				await message.react('⭐');
			}
		}
	}
}
