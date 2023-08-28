import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import levelManager from '../lib/levelManager';
import type { LevelsInterface } from '../lib/levelDataBase';

@ApplyOptions<Listener.Options>({
	event: 'levelledUp',
	name: 'Level Up',
	emitter: levelManager
})
export class UserEvent extends Listener {
	public override async run(levelDB: LevelsInterface) {
		const server = this.container.client.guilds.cache.get('747485611409145889');
		const member = await server?.members.fetch(levelDB.id);

		if (levelDB.level === 3) {
			return member?.roles.add('759085739723456563');
		}

		return;
	}
}
