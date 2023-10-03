import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { ActionRowBuilder, type MessageActionRowComponentBuilder, type Interaction, ButtonBuilder, ButtonStyle } from 'discord.js';
import config from '../config.json';
import { Duration, TimerManager } from '@sapphire/time-utilities';

@ApplyOptions<Listener.Options>({
	name: 'Manual Staff Screening',
	event: Events.InteractionCreate
})
export class UserEvent extends Listener {
	public override async run(interaction: Interaction) {
		if (!interaction.isButton()) return;
		const args = interaction.customId.split('|');
		if (args[0] !== 'screen') return;

		const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();

		if (args[2] === 'approve') {
			const member = await interaction.guild?.members.fetch(args[1]).catch(() => undefined);
			if (!member) return interaction.reply({ content: 'Could not find member', ephemeral: true });

			actionRow.setComponents(
				new ButtonBuilder()
					.setDisabled(true)
					.setCustomId('null')
					.setEmoji('✅')
					.setLabel(`Approved by @${interaction.user.username}`)
					.setStyle(ButtonStyle.Success)
			);

			await interaction.update({ components: [actionRow] });

			TimerManager.setTimeout(() => {
				interaction.channel?.send({
					content:
						'It has been 24 hours since this member has been approved by a staff, check up on them if they need assistance navigating in the server!',
					embeds: interaction.message.embeds
				});
			}, new Duration('1 day').offset);

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
			return interaction.guild?.bans.create(args[1], {
				reason: `Suspicious or spam account\nMod: @${interaction.user.username} (${interaction.user.id})`
			});
		}
	}
}
