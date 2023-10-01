import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { EmbedBuilder, GuildBan } from 'discord.js';

@ApplyOptions<Listener.Options>({
	name: 'Ban Appeal Informant',
	event: Events.GuildBanAdd
})
export class UserEvent extends Listener {
	public override run(ban: GuildBan) {
		const embed = new EmbedBuilder()
			.setColor('Aqua')
			.setTitle('You have been banned from the VTA')
			.setDescription('If you think this is a mistake, then please DM @VTuberAcademy on Twitter/X\n\nhttps://x.com/VTuberAcademy')
			.setTimestamp()
			.setFields({ name: 'Reason', value: `${ban.reason}` });

		return ban.user.send({ embeds: [embed] }).catch(() => null);
	}
}
