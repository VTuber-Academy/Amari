import { ApplyOptions } from '@sapphire/decorators';
import { Listener, type Store } from '@sapphire/framework';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import mongoose from 'mongoose';
import { Octokit } from '@octokit/rest';

const dev = process.env.NODE_ENV !== 'production';
let version = 'fetching...';

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
	private readonly style = dev ? yellow : blue;

	public async run() {
		this.printBanner();
		this.printStoreDebugInformation();

		await this.connectMongo();
		await this.fetchVersion().then((v) => {
			version = v;
			this.container.logger.info(`Version retrieved! Amari is running on  #${version}`);
		});
	}

	private async connectMongo() {
		if (!process.env.MongoDB_URL) {
			return new Error('Mongo Database URL not provided in .env');
		}

		return mongoose
			.connect(process.env.MongoDB_URL, { dbName: process.env.MongoDB_Name })
			.catch((error) => new Error(error))
			.then(() => this.container.logger.info(`Mongoose successfully connected!`));
	}

	private async fetchVersion() {
		const octokit = new Octokit({
			auth: process.env.GITHUB_TOKEN
		});

		const { data } = await octokit.rest.repos.listCommits({
			owner: process.env.GITHUB_ORG ?? '',
			repo: process.env.GITHUB_REPO ?? ''
		});

		const latestCommitHash = data[0].sha.substring(0, 7);
		return latestCommitHash;
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

export default version;
