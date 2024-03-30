import './Amari Core/lib/setup';

import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';

import { getRootData } from '@sapphire/pieces';
import modules from './moduleRegistry.json';
import { join } from 'node:path';
import fs from 'fs';

import { createApi } from 'unsplash-js';

// Ensure .env is loaded properly despite skyra's env-utilities
import dotenv from 'dotenv';
dotenv.config({ path: './src/.env', override: true });

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
				fs.writeFileSync(join(pluginWorkingFolder, 'config.json'), pluginConfig, {
					encoding: 'utf-8'
				});

				client.stores.registerPath(pluginWorkingFolder);
				client.logger.info(`Successfully registered ${manifest.Name} v${manifest.Version}`);
			} catch (error) {
				client.logger.fatal(`Cannot Load ${name} from path ${path}!`);
				client.logger.fatal('Please ensure that the plugin matches the folder name in moduleRegistry.json');
				client.logger.fatal('Please ensure that each plugin has a manifest.json');
				client.logger.fatal('Please ensure that each manifest.json is properly structured');
				client.logger.fatal(error);
			}
		}

		if (process.env.Unsplash_AccessKey) {
			const unsplashApi = createApi({
				accessKey: process.env.Unsplash_AccessKey,
				fetch: fetch
			});

			container.unsplash = unsplashApi;
		} else {
			client.logger.warn('Unsplash API key not found. Some features may not work as intended.');
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

declare module '@sapphire/pieces' {
	interface Container {
		unsplash: ReturnType<typeof createApi>;
	}
}
