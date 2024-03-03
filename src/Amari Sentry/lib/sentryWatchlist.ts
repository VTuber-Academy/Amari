import mongoose, { Document, Schema } from 'mongoose';

// Define the member schema
interface Member extends Document {
	discordId: string;
	reason: string;
}

const memberSchema = new Schema<Member>({
	discordId: { type: String, required: true },
	reason: { type: String, required: true }
});

// Create the member model
const watchlistDatabase = mongoose.model<Member>('Sentry Watchlist', memberSchema);

export default watchlistDatabase;
