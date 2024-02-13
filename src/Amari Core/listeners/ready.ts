import { ApplyOptions } from '@sapphire/decorators';
import { Listener, type Store } from '@sapphire/framework';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import mongoose from 'mongoose';

const dev = process.env.NODE_ENV !== 'production';

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
	private readonly style = dev ? yellow : blue;

	public async run() {
		this.printBanner();
		this.printStoreDebugInformation();

		await this.connectMongo();
		console.log(mongoose.connection.readyState === 1 ? 'Connected to MongoDB' : 'Failed to connect to MongoDB');
	}

	private async connectMongo() {
		if (!process.env.MongoDB_URL) {
			return new Error('Mongo Database URL not provided in .env');
		}

		return mongoose.connect(process.env.MongoDB_URL, { dbName: process.env.MongoDB_Name }).catch((error) => new Error(error));
	}

	private printBanner() {
		const success = green('+');

		const llc = dev ? magentaBright : white;
		const blc = dev ? magenta : blue;

		const line01 = llc('');
		const line02 = llc('');
		const line03 = llc('');

		// Offset Pad
		const pad = ' '.repeat(7);

		console.log(
			String.raw`
${line01} ${pad}${blc('1.0.0')}
${line02} ${pad}[${success}] Gateway
${line03}${dev ? ` ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : ''}
		`.trim()
		);
	}

	private printStoreDebugInformation() {
		const { client, logger } = this.container;
		const stores = [...client.stores.values()];
		const last = stores.pop()!;

		for (const store of stores) logger.info(this.styleStore(store, false));
		logger.info(this.styleStore(last, true));
	}

	private styleStore(store: Store<any>, last: boolean) {
		return gray(`${last ? '└─' : '├─'} Loaded ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}.`);
	}
}
