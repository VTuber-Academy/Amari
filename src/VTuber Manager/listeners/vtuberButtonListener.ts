import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import VTuberManager from 'VTuber Manager/lib/VTuberManager';
import VTuberFormResponseModel from 'VTuber Manager/lib/VTubers';
import { ActionRowBuilder, Interaction, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: Events.InteractionCreate,
	name: 'VTuber Button Listener'
})
export class UserEvent extends Listener {
	public override async run(interaction: Interaction) {
		if (!interaction.isButton()) return;

		const [command, action, ...args] = interaction.customId.split(':');
		if (command !== 'vtuber') return;

		if (action === 'apply') {
			await interaction.deferReply();
			await interaction.message.edit({ components: [] });

			await VTuberManager.sendReview(interaction.user.id);
			return interaction.deleteReply();
		} else if (action === 'accept') {
			await interaction.deferReply({ ephemeral: true });
			await interaction.message.edit({ components: [] });

			await VTuberManager.acceptApplication(args[0]);

			return interaction.followUp({ content: `VTuber approved by ${interaction.user}` });
		} else if (action === 'reject') {
			const database = await VTuberFormResponseModel.findOne({ _id: args[0] });
			if (!database) return interaction.followUp({ content: 'Application not found', ephemeral: true });

			const rejectionModal = new ModalBuilder()
				.setTitle(`Would you like to reject ${database['VTuber Name']}?`)
				.setCustomId(`vtuber:reject:${args[0]}`);

			const rejectionModalRow = new ActionRowBuilder<ModalActionRowComponentBuilder>();

			const rejectionModalInput = new TextInputBuilder()
				.setCustomId('reason')
				.setLabel('Reason for rejection')
				.setRequired(true)
				.setPlaceholder('Please provide a reason for rejection')
				.setStyle(TextInputStyle.Paragraph);

			rejectionModalRow.addComponents(rejectionModalInput);
			rejectionModal.addComponents(rejectionModalRow);

			return interaction.showModal(rejectionModal);
		}
	}
}
