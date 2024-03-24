import './Amari Core/lib/setup';

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';

import { getRootData } from '@sapphire/pieces';
import modules from './moduleRegistry.json';
import { join } from 'node:path';
import fs from 'fs';

import dotenv from 'dotenv';
dotenv.config({ path: './src/.env' });

interface PluginManifest {
	Name: string;
	Version: number;
	configurationProfiles: {
		development: Record<any, any>;
		production: Record<any, any>;
		test: Record<any, any>;
	};
}

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
	partials: [Partials.Channel, Partials.GuildMember],
	presence: {
		status: 'online',
		activities: [{ name: 'in the library 📚', type: ActivityType.Playing }]
	},
	api: {
		origin: '*',
		prefix: 'api/',
		listenOptions: {
			port: 3000
		}
	}
});

const main = async () => {
	try {
		const rootData = getRootData();
		for (const [name, path] of Object.entries(modules)) {
			try {
				let pluginWorkingFolder = join(rootData.root, path);
				let manifest: PluginManifest = JSON.parse(fs.readFileSync(join(pluginWorkingFolder, 'manifest.json'), 'utf-8'));

				const pluginConfig = JSON.stringify(manifest.configurationProfiles[process.env.NODE_ENV]);
				fs.writeFileSync(join(pluginWorkingFolder, 'config.json'), pluginConfig, 'utf-8');

				client.stores.registerPath(join(rootData.root, path));
				client.logger.info(`Successfully registered ${manifest.Name} v${manifest.Version}`);
			} catch (error) {
				client.logger.fatal(`Cannot Load ${name} from path ${path}!`);
				client.logger.fatal('Please ensure that the plugin matches the folder name in moduleRegistry.json');
				client.logger.fatal('Please ensure that each plugin has a manifest.json');
				client.logger.fatal('Please ensure that each manifest.json is properly structured');
				client.logger.fatal(error);
			}
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
