import levelProfile from '../models/level';
import settingsModel from '../models/settings';

class LevelDb {
	async get(userID: string) {
		let userEntry = await levelProfile.findOne({discordId: userID});

		if (!userEntry) {
			userEntry = new levelProfile({
				discordId: userID,
				experience: 0,
				level: 0,
			});

			await userEntry.save();
		}

		return userEntry;
	}
}

class SettingsDb {
	async get(guildID: string) {
		let settings = await settingsModel.findOne({guildId: guildID});

		if (!settings) {
			settings = new settingsModel({
				guildId: guildID,
				amariLevel: {
					cooldown: 120000,
				},
			});
		}

		return settings;
	}
}

const settingsDatabase = new SettingsDb();

const levelDatabase = new LevelDb();
export {levelDatabase, settingsDatabase};
