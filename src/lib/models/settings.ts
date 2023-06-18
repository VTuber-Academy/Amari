import {Schema, model} from 'mongoose';

type SettingsI = {
	guildId: string;
	amariLevel: {
		cooldown: number;
	};
};

const settingSchema = new Schema<SettingsI>({
	guildId: String,
	amariLevel: {
		cooldown: Number,
	},
});

const settingsModel = model<SettingsI>('Server Settings', settingSchema);
export default settingsModel;
