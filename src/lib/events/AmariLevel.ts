import {levelDatabase, settingsDatabase} from './Database';
import {evaluate} from 'mathjs';

class LevelManager {
	/**
	 * Modifies a user's level
	 * @param userId Discord User ID
	 * @param guildId Guild ID
	 * @param amount + or - numbers to modify
	 * @param forced skip cooldown or not
	 */
	async modifyMessageLevel(userId: string, guildId: string, amount: number) {
		// TODO: Settings Command that modifies the algorithm

		let levelUp = false;
		const userEntry = await levelDatabase.get(userId);
		const levelSettings = (await settingsDatabase.get(guildId)).amariLevel;

		if ((await checkCooldown(userEntry.lastActivity, levelSettings.message.cooldown))) {
			return;
		}

		userEntry.lastActivity = Date.now();

		userEntry.experience += amount;

		// Evaluates the algorithm provided in guild settings
		const needExp = Number(evaluate(levelSettings.algorithm, {$level$: userEntry.level}));

		const level = Math.trunc(userEntry.experience / needExp);
		if (level > 0) {
			userEntry.level += 1;
			userEntry.experience = 0;

			levelUp = true;
		} else if (level < 0) {
			userEntry.level -= level;
			userEntry.experience = 0;
		}

		if (userEntry.level < 0) {
			userEntry.level = 0;
		}

		userEntry.lastActivity = Date.now();
		await userEntry.save();
		return levelUp;
	}
}

const levelManager = new LevelManager();
export default levelManager;

/**
	 * Checks if the user is in cooldown! Returns true if the user is in cooldown
	 * @param {Date} timestamp User's last saved timestamp
	 * @param {number} duration How long the current cooldown is
	 * @returns {Promise<boolean>}
	 */
async function checkCooldown(timestamp: number, duration: number) {
	const expiryTime = timestamp + duration;

	if (expiryTime < Date.now()) {
		return false;
	}

	return true;
}
