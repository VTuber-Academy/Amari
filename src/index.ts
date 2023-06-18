import './lib/setup';
import {LogLevel, SapphireClient} from '@sapphire/framework';
import {GatewayIntentBits, Partials} from 'discord.js';
import * as mongoose from 'mongoose';

const client = new SapphireClient({
	logger: {
		level: LogLevel.Debug,
	},
	intents: [
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Channel, Partials.Message],
	loadMessageCommandListeners: true,
});

const main = async () => {
	try {
		if (process.env.MongoDB_URL) {
			client.logger.info('Connecting to the database...');
			const db = await mongoose.connect(process.env.MongoDB_URL, {
				appName: 'Amari Bot',
				dbName: 'Amari-Bot',
			});
			client.logger.info(`Connected to ${db.connection.name}!`);
		}

		client.logger.info('Logging in to Discord');
		await client.login();
		client.logger.info(`Logged in as @ ${client.user?.username ?? 'Failed to fetch username at this time'}`);
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

main().catch(error => {
	client.logger.fatal('Failed to initialize the bot');
	client.logger.trace(error);
});
