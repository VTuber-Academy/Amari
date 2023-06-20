import {AllFlowsPrecondition} from '@sapphire/framework';
import type {CommandInteraction, ContextMenuCommandInteraction, Message, Snowflake} from 'discord.js';

const owners = process.env.OWNERS?.split(' ') ?? [];

export class UserPrecondition extends AllFlowsPrecondition {
	#message = 'This command can only be used by the owner.';

	public override chatInputRun(interaction: CommandInteraction) {
		return this.doOwnerCheck(interaction.user.id);
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return this.doOwnerCheck(interaction.user.id);
	}

	public override messageRun(message: Message) {
		return this.doOwnerCheck(message.author.id);
	}

	private doOwnerCheck(userId: Snowflake) {
		return owners.includes(userId) ? this.ok() : this.error({message: this.#message});
	}
}

declare module '@sapphire/framework' {
	type Preconditions = {
		OwnerOnly: never;
	};
}
