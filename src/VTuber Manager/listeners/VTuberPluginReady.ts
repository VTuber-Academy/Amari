import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import VTuberManager from '../lib/VTuberManager';
import { Client } from 'discord.js';
import config from '../config.json';

@ApplyOptions<Listener.Options>({
	event: Events.ClientReady,
	name: 'VTuber Client Ready'
})
export class UserEvent extends Listener {
	public override async run(_client: Client) {
		const server = await VTuberManager.fetchDiscordServer();
		if (!server) return;

		const role = await server.roles.fetch(config.vtuberRole);
		if (!role) this.container.logger.error('VTuber role not found');

		role?.members.forEach(async (member) => {
			await VTuberManager.assignRole(member.id);
		});
	}
}
