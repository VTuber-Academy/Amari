import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Interaction, MessageActionRowComponentBuilder } from 'discord.js';
import config from '../../config.json';

@ApplyOptions<Listener.Options>({
	event: Events.InteractionCreate,
	name: 'Automated Screening Interaction Handler'
})
export class UserEvent extends Listener {
	public override async run(interaction: Interaction) {
		if (interaction.isButton()) {
			const args = interaction.customId.split('-');

			if (args[0] != 'screening') return;
			const member = args[2] ? await interaction.guild?.members.fetch(args[2]).catch(() => undefined) : undefined;

			const resultsEmbed = new EmbedBuilder().setTimestamp();

			const decoratedButton = new ButtonBuilder().setCustomId('notlikethismatters').setDisabled(true);
			const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();

			switch (args[1]) {
				case 'approve':
					if (!member) return interaction.reply({ content: 'Cannot find member in the server!', ephemeral: true });

					decoratedButton.setLabel(`Approved by @${interaction.user.username}`).setStyle(ButtonStyle.Success);
					actionRow.addComponents(decoratedButton);
					await interaction.update({ components: [actionRow] });

					resultsEmbed
						.setColor('Green')
						.setTitle('Welcome to the VTA!')
						.setDescription(
							'This is Amari speaking, codenamed VTA-Bot.\n\nAmari watches over members within the discord server and is excited to welcome you! You have passed our manual safety checks and now you are welcome to freely chat in our server! If you have any questions, contact <@575252669443211264> and a human will be there with you shorty.\n\nSee you soon!'
						);

					await member.send({ embeds: [resultsEmbed] }).catch(() => null); // Ignore failure, welcome messages are often ignored anyways :c

					return member.roles
						.remove(config.tranquilizerRole)
						.catch((err) => interaction.reply({ content: `Failed to remove role\nReason: ${err}` }));
				case 'reject':
					resultsEmbed
						.setColor('Orange')
						.setTitle("We're sorry!")
						.setDescription(
							'A staff has manually reviewed your profile and found your profile to be harmful towards the discord server. If you think this is a mistake, contact VTA through twitter! [@VTuberAcademy](https://x.com/vtuberacademy)'
						);

					decoratedButton.setLabel(`Rejected by @${interaction.user.username}`).setStyle(ButtonStyle.Danger);
					actionRow.addComponents(decoratedButton);
					await interaction.update({ components: [actionRow] });

					return interaction.guild?.bans.create(args[2], {
						reason: `Suspicious or Spam Account\nResponsible moderator: @${interaction.member?.user.username} (${interaction.user.id})`
					});
				default:
					return this.container.logger.warn(`Unexpected screening argument "${args[1]}"`);
			}
		}
	}
}
