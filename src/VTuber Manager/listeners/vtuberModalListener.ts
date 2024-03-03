import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import VTuberManager from 'VTuber Manager/lib/VTuberManager';
import { Interaction } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: Events.InteractionCreate,
	name: 'VTuber Modal Listener'
})
export class UserEvent extends Listener {
	public override async run(interaction: Interaction) {
		if (!interaction.isModalSubmit()) return;

		const [command, action, ...args] = interaction.customId.split(':');
		if (command !== 'vtuber') return;

		if (action === 'reject') {
			await interaction.deferReply({ ephemeral: true });
			await interaction.message?.edit({ components: [] });

			await VTuberManager.rejectApplication(args[0], interaction.fields.getTextInputValue('reason'));

			return interaction.followUp({ content: `VTuber rejected by ${interaction.user}` });
		}

		return this.container.logger.warn('Unknown Modal Action!', command, action, args);
	}
}
