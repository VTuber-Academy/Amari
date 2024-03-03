import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { annFeedItem, annFeeder } from '../lib/animeNewsNetworkFeed';
import config from '../config.json';

@ApplyOptions<Listener.Options>({
	event: 'new-item',
	emitter: annFeeder
})
export class UserEvent extends Listener {
	public override async run(item: annFeedItem) {
		const server = await this.container.client.guilds.fetch(config.vtuberNewsServer);
		const channel = await server.channels.fetch(config.vtuberNewsChannel);

		if (!item.categories) return;
		if (item.categories.includes('VTubers')) {
			if (!channel) return this.container.logger.error('Channel not found');
			if (!channel.isTextBased()) return this.container.logger.error('Channel is not text based');

			const message = await channel.send({
				content: `# ${item.title}\n${item.content}...\n\nRead more here! ${item.link}\n\`\`\`${item.pubDate}\`\`\``
			});

			if (config.vtuberNewsPingRole) {
				const msg = await channel.send(`<@&${config.vtuberNewsPingRole}>`);

				setTimeout(() => {
					if (msg.deletable) {
						msg.delete();
					}
				}, 3000);
			}

			if (message.crosspostable) {
				await message.crosspost();
			}
		}
	}
}
