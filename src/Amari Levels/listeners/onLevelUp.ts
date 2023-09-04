import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import levelManager from '../lib/levelManager';
import type { LevelsInterface } from '../lib/levelDataBase';
import { EmbedBuilder } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: 'levelledUp',
	name: 'Level Up',
	emitter: levelManager
})
export class UserEvent extends Listener {
	public override async run(levelDB: LevelsInterface) {
		const server = this.container.client.guilds.cache.get('747485611409145889');
		const member = await server?.members.fetch(levelDB.id);
		if (!member) return;

		if (!member.roles.cache.has('759085739723456563')) {
			const nEmbed = new EmbedBuilder()
				.setColor('Yellow')
				.setTitle('We officially welcome you to the VTA!')
				.addFields({
					name: 'Why did I receive this message?',
					value: "You reached community level 1 on the VTA Discord Server which gives you access to our VCs and Events! You'll know when you've leveled up when your message has a ⭐ on it!",
					inline: true
				})
				.setTimestamp();

			await member.send({ embeds: [nEmbed] }).catch(() => 0);
			return member.roles.add('759085739723456563');
		}

		return this.container.logger.info(`@${member.user.username} has levelled up!`);
	}
}
