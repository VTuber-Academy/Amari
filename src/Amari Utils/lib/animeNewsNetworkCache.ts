import mongoose, { Schema } from 'mongoose';
import { annFeedItem } from './animeNewsNetworkFeed';

const feedSchema = new Schema<annFeedItem>({
	title: { type: String, required: true },
	link: { type: String, required: true },
	guid: { type: String, required: true },
	content: { type: String, required: true },
	pubDate: { type: String, required: true },
	categories: Array
});

// Create the member model
const annDb = mongoose.model<annFeedItem>('Anime News Network Feed', feedSchema);
export default annDb;
