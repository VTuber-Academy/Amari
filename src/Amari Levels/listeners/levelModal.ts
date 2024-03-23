import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import levelDatabase from 'Amari Levels/lib/levelDataBase';
import { EmbedBuilder, Interaction } from 'discord.js';

@ApplyOptions<Listener.Options>({
	enabled: true,
	event: Events.InteractionCreate,
	name: 'Handle modify levels interactions'
})
export class UserEvent extends Listener {
	public override async run(interaction: Interaction) {
		if (!interaction.isModalSubmit()) return;

		const { customId } = interaction;
		const [action, type, userId] = customId.split(':');

		if (action === 'levels') {
			if (type === 'modify') {
				const experience = interaction.fields.getTextInputValue('experience');
				const level = interaction.fields.getTextInputValue('level');

				const profile = await levelDatabase.findOne({ id: userId });
				if (!profile) return;

				profile.experience = parseInt(experience);
				profile.level = parseInt(level);
				await profile.save();

				const successEmbed = new EmbedBuilder()
					.setTitle('Success')
					.setDescription(`Successfully modified ${userId}'s levels`)
					.setColor('Green')
					.addFields([
						{ name: 'Level', value: level, inline: true },
						{ name: 'Experience', value: experience, inline: true }
					])
					.setFooter({ text: 'Amari Levels' })
					.setAuthor({ name: 'Modify Levels', iconURL: interaction.client.user.displayAvatarURL() });

				return interaction.reply({ embeds: [successEmbed] });
			}
		}

		return;
	}
}
