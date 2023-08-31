import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import type { Client } from 'discord.js';
import csvParser from 'csv-parser';
import { createReadStream } from 'fs';
import path from 'path';

interface namesRow {
	'Year of Birth': string;
	Gender: string;
	Ethnicity: string;
	"Child's First Name": string;
	Count: string;
	Rank: string;
}

let CEName: string[] = [];

@ApplyOptions<Listener.Options>({
	event: Events.ClientReady,
	once: true
})
export class UserEvent extends Listener {
	public override async run(client: Client) {
		client.logger.info('Preloading Mod Tools, Certain Features may be unavailable');

		CEName = (await this.parseNames()) as string[];

		client.logger.info('Preload Complete!');
	}

	private async parseNames() {
		return new Promise((resolve, reject) => {
			const names: string[] = [];
			const stream = createReadStream(path.join(__dirname, '../lib/Popular_Baby_Names.csv')).pipe(csvParser());

			stream.on('data', (row: namesRow) => {
				if (row["Child's First Name"]) {
					names.push(row["Child's First Name"]);
				}
			});

			stream.on('end', () => {
				resolve(names);
			});

			stream.on('error', (error: any) => {
				reject(error);
			});
		});
	}
}

export default CEName;
