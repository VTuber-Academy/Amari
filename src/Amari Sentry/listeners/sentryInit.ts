import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';

@ApplyOptions<Listener.Options>({
	event: Events.ClientReady,
	name: 'Sentry Initialize'
})
export class UserEvent extends Listener {
	public override run() {}
}
