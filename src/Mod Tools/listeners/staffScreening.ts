import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { ActionRowBuilder, type MessageActionRowComponentBuilder, type Interaction, ButtonBuilder, ButtonStyle } from 'discord.js';
import config from '../config.json';

@ApplyOptions<Listener.Options>({
	name: 'Manual Staff Screening',
	event: Events.InteractionCreate
})
export class UserEvent extends Listener {
	public override async run(interaction: Interaction) {
		if (!interaction.isButton()) return;
		const args = interaction.customId.split('|');
		if (args[0] !== 'screen') return;

		const member = await interaction.guild?.members.fetch(args[1]);
		if (!member) return interaction.reply({ content: 'Could not find member', ephemeral: true });

		const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();

		if (args[2] === 'approve') {
			actionRow.setComponents(
				new ButtonBuilder()
					.setDisabled(true)
					.setCustomId('null')
					.setEmoji('✅')
					.setLabel(`Approved by @${interaction.user.username}`)
					.setStyle(ButtonStyle.Success)
			);

			await interaction.update({ components: [actionRow] });
			return member.roles.remove(config.flagRole).catch(() => null);
		} else {
			actionRow.setComponents(
				new ButtonBuilder()
					.setDisabled(true)
					.setCustomId('null')
					.setEmoji('❌')
					.setLabel(`Rejected by @${interaction.user.username}`)
					.setStyle(ButtonStyle.Danger)
			);

			await interaction.update({ components: [actionRow] });
			return interaction.guild?.bans.create(member, {
				reason: `Suspicious or spam account\nMod: @${interaction.user.username} (${interaction.user.id})`
			});
		}
	}
}
