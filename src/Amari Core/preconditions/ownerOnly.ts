import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';

export class UserPrecondition extends Precondition {
	public override messageRun(message: Message) {
		if (message.author.id === process.env.OWNER) {
			return this.ok();
		} else {
			return this.error({ message: 'You cannot access this command!' });
		}
	}

	public override chatInputRun(interaction: ChatInputCommandInteraction) {
		if (interaction.user.id === process.env.OWNER) {
			return this.ok();
		} else {
			return this.error({ message: 'You cannot access this command!' });
		}
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		if (interaction.user.id === process.env.OWNER) {
			return this.ok();
		} else {
			return this.error({ message: 'You cannot access this command!' });
		}
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		ownerOnly: never;
	}
}
