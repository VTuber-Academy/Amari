import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { annFeeder } from '../lib/animeNewsNetworkFeed';

@ApplyOptions<Listener.Options>({
	event: Events.ClientReady,
	once: true
})
export class UserEvent extends Listener {
	public override async run() {
		setInterval(async () => {
			await annFeeder.fetch();
		}, 60000);
	}
}
