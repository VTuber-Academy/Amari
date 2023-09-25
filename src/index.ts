import './Amari Core/lib/setup';

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits, Partials } from 'discord.js';

import { getRootData } from '@sapphire/pieces';
import modules from './moduleRegistry.json';
import { join } from 'node:path';
import fs from 'fs';

import express from 'express';
const app = express();
const port = 10000;

interface pluginManifest {
	Name: string;
	Version: number;
	configurationProfiles: {
		development: Record<any, any>;
		production: Record<any, any>;
		test: Record<any, any>;
	};
}

app.get('/', (_req, res) => {
	// 200 status code means OK
	res.status(200).send('Amari Network is Running!');
});

app.listen(port, () => {
	console.log(`Amari Network listening to port ${port}`);
});

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
	partials: [Partials.Channel, Partials.GuildMember]
});

const main = async () => {
	try {
		const rootData = getRootData();
		for (const [name, path] of Object.entries(modules)) {
			try {
				let pluginWorkingFolder = join(rootData.root, path);
				let manifest: pluginManifest = JSON.parse(fs.readFileSync(join(pluginWorkingFolder, 'manifest.json'), 'utf-8'));

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
