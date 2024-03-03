import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Interaction } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: Events.InteractionCreate,
	name: 'Test'
})
export class UserEvent extends Listener {
	public override async run(interaction: Interaction) {
		if (interaction.isButton()) {
			if (interaction.customId === 'test-dm') {
				await interaction.user
					.send('Test success! DMs are enabled!')
					.catch(() => {
						interaction.followUp('Test failed! DMs are disabled!');
					})
					.then(() => {
						interaction.deferUpdate();
					});
			}
		}
	}
}
