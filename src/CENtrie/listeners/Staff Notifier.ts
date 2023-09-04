import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import type { Client, TextChannel } from 'discord.js';
import config from '../config.json';

@ApplyOptions<Listener.Options>({
	name: 'Staff Notifier',
	event: Events.ClientReady
})
export class UserEvent extends Listener {
	public override async run(client: Client) {
		const server = await client.guilds.fetch(config.ready.notificationServ);
		const channel = (await server.channels.fetch(config.ready.notificationChan)) as TextChannel;

		channel.send('VTA Bot has been updated ✅');
	}
}
