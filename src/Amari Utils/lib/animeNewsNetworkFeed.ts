import Parser from 'rss-parser';
import annDb from './animeNewsNetworkCache';
import { EventEmitter } from 'events';
import mongoose from 'mongoose';

interface feedChannel {
	title: string;
	link: string;
	description: string;
	language: string;
	copyright: string;
	lastBuildDate: string;
}

export interface annFeedItem {
	title: string;
	link: string;
	guid: string;
	content: string;
	pubDate: string;
	categories: string[];
}

const parser: Parser<feedChannel, annFeedItem> = new Parser({});

class animeNewsNetworkFeed extends EventEmitter {
	async fetch() {
		if (mongoose.connection.readyState !== 1) return;
		const feed = await parser.parseURL('https://www.animenewsnetwork.com/interest/rss.xml?ann-edition=us');

		const items = await annDb.find({});

		await Promise.all(
			feed.items.map(async (currentItem) => {
				if (items.filter((item) => item.guid === currentItem.guid).length < 1) {
					await annDb.create(currentItem);

					this.emit('new-item', currentItem);
				}
			})
		);
	}
}

export const annFeeder = new animeNewsNetworkFeed();
