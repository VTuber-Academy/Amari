import './Amari Core/lib/setup';

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits, Partials } from 'discord.js';

import { getRootData } from '@sapphire/pieces';
import modules from './moduleRegistry.json';
import { join } from 'node:path';

const client = new SapphireClient({
	logger: {
		level: LogLevel.Debug
	},
	intents: [
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Channel]
});

const main = async () => {
	try {
		const rootData = getRootData();
		for (const [name, path] of Object.entries(modules)) {
			client.stores.registerPath(join(rootData.root, path));
			client.logger.info(`Registered Module: ${name}`);
		}

		client.logger.info('Logging in');
		await client.login();
		client.logger.info(`Successfully logged in as ${client.user?.username}`);
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

main();
