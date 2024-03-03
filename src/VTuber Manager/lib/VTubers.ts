import mongoose, { Schema, Document } from 'mongoose';

interface IVTuberFormResponse extends Document {
	'Discord ID': string;
	'Do you want to delete your application?': string;
	'VTuber Avatar (Square Size Preferred)': { mime: string; 64: string };
	'VTuber Name': string;
	'Description (3rd person perspective recommended)': string;
	'Lore (if any)'?: string;
	'Model Type': string;
	'Debut Date': string;
	'Group Code'?: string;
	Genre: string[];
	Language: string;
	'Do you stream?'?: string;
	'Twitch / YouTube URL'?: string;
	'Do you make regular content? (Videos)'?: string;
	'YouTube / TikTok URL'?: string;
	ResponseID: string;
	Status: {
		code: 'Confirmation' | 'Review' | 'Accepted';
		id?: string;
		lastUpdated?: Date;
	};
	// id: Message ID
}

const VTuberFormResponseSchema: Schema = new Schema({
	'Discord ID': { type: String, required: true },
	'Do you want to delete your application?': { type: String, enum: ['Yes', 'No'], required: true },
	'VTuber Avatar (Square Size Preferred)': {
		mime: { type: String, required: true },
		64: { type: String, required: true }
	},
	'VTuber Name': { type: String, required: true },
	'Description (3rd person perspective recommended)': { type: String, required: true },
	'Lore (if any)': { type: String },
	'Model Type': { type: String, required: true },
	'Debut Date': { type: String, required: true },
	'Group Code': { type: String },
	Genre: { type: [String], required: true },
	Language: { type: String, required: true },
	'Do you stream?': { type: String, enum: ['Yes', 'No'] },
	'Twitch / YouTube URL': { type: String },
	'Do you make regular content? (Videos)': { type: String },
	'YouTube / TikTok URL': { type: String },
	ResponseID: { type: String, required: true },
	Status: {
		code: { type: Number, enum: [0, 1, 2], default: 0 },
		id: { type: String },
		lastUpdated: { type: Date }
	}
});

const VTuberFormResponseModel = mongoose.model<IVTuberFormResponse>('VTubers', VTuberFormResponseSchema);

export default VTuberFormResponseModel;
