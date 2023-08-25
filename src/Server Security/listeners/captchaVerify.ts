import { ApplyOptions } from '@sapphire/decorators';
import type { AnyInteraction } from '@sapphire/discord.js-utilities';
import { Events, Listener } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMemberRoleManager, type MessageActionRowComponentBuilder } from 'discord.js';
import * as emoji from 'node-emoji';
import * as config from '../config.json';

let cooldownMembers: string[] = [];

@ApplyOptions<Listener.Options>({
	event: Events.InteractionCreate,
	name: 'Verify Captcha'
})
export class UserEvent extends Listener {
	public override async run(interaction: AnyInteraction) {
		if (!interaction.isButton()) return;

		if (interaction.customId === 'captcha-verify') {
			if (cooldownMembers.includes(interaction.user.id))
				return interaction.reply({ content: 'Please wait a moment before regenerating another captcha!', ephemeral: true });

			const captcha = await this.generateCaptcha();
			cooldownMembers.push(interaction.user.id);
			setTimeout(() => {
				cooldownMembers = cooldownMembers.filter((member) => member !== interaction.user.id);
			}, 60000);

			return interaction.reply({
				ephemeral: true,
				components: captcha.components,
				content: `Please select the button that has the ${captcha.captchaEmoji.name} emoji (${captcha.captchaEmoji.emoji})`
			});
		}

		if (interaction.customId.startsWith('captcha-incorrect')) {
			return interaction.update({ content: 'Beep Boop was the challenge too hard? ❌ Captcha Incorrect', components: [] });
		}

		if (interaction.customId.startsWith('captcha-correct')) {
			const role = await interaction.guild?.roles.fetch(config.verifiedRole);
			if (!role) return interaction.update('We could not find the verified role in the server, please inform the moderators!');

			const roleManager = interaction.member?.roles as GuildMemberRoleManager;

			roleManager.add(role);
			return interaction.update({
				content:
					"Congratulations! You've got the intellect of a human! ✅ Captcha Correct\n\nPlease wait for all the channels to show up or refresh your discord app <3",
				components: []
			});
		}

		return;
	}

	private async generateCaptcha() {
		const components = [];
		const captchaEmoji = emoji.random();
		const correctRow = Math.abs(Math.floor(Math.random() * (1 - 5) + 1));
		const correctButton = Math.abs(Math.floor(Math.random() * (1 - 5) + 1));

		for (let i = 0; i < 5; i++) {
			const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();

			for (let t = 0; t < 5; t++) {
				if (i === correctRow && t === correctButton) {
					actionRow.addComponents(
						new ButtonBuilder().setCustomId(`captcha-correct-${t}${i}`).setEmoji(captchaEmoji.emoji).setStyle(ButtonStyle.Secondary)
					);
				} else {
					let inEmoji = emoji.random();

					while (inEmoji === captchaEmoji) {
						inEmoji = emoji.random();
					}

					actionRow.addComponents(
						new ButtonBuilder().setCustomId(`captcha-incorrect-${t}${i}`).setEmoji(inEmoji.emoji).setStyle(ButtonStyle.Secondary)
					);
				}
			}

			components.push(actionRow);
		}

		return { components, captchaEmoji };
	}
}
