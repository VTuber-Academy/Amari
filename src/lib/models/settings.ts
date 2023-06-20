import {Schema, model} from 'mongoose';

type SettingsI = {
	guildId: string;
	amariLevel: {
		algorithm: string;
		message: {
			cooldown: number;
			reward: string;
		};
		voice: {
			cooldown: number;
			reward: string;
		};
	};
};

const settingSchema = new Schema<SettingsI>({
	guildId: String,
	amariLevel: {
		algorithm: String,
		message: {
			reward: String,
			cooldown: Number,
		},
		voice: {
			reward: String,
			cooldown: Number,
		},
	},
});

const settingsModel = model<SettingsI>('Server Settings', settingSchema);
export default settingsModel;
