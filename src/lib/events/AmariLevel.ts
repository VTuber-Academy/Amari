import {EventEmitter} from 'events';
import {levelDatabase, settingsDatabase} from './Database';

class LevelManager extends EventEmitter {
	/**
	 * Modifies a user's level
	 * @param id Discord User ID
	 * @param gId Guild ID
	 * @param amount + or - numbers to modify
	 * @param forced skip cooldown or not
	 */
	async modifyLevel(id: string, gId: string, amount: number, forced: boolean) {
		// TODO: Settings Command that modifies the algorithm

		const userEntry = await levelDatabase.get(id);
		const levelSettings = (await settingsDatabase.get(gId)).amariLevel;

		if (!forced) {
			if (!(await this.checkCooldown(userEntry.lastActivity, levelSettings.cooldown))) {
				userEntry.lastActivity = Date.now();
			}
		}

		// TODO: Function to calculate xp to next level with an algorithm

		await userEntry.save();
	}

	/**
	 * Checks if the user is in cooldown! Returns true if the user is in cooldown
	 * @param {Date} timestamp User's last saved timestamp
	 * @param {number} duration How long the current cooldown is
	 * @returns {Promise<boolean>}
	 */
	async checkCooldown(timestamp: number, duration: number) {
		const expiryTime = timestamp + duration;

		if (expiryTime < Date.now()) {
			return false;
		}

		return true;
	}
}

function calculateNextLevel(level: number) {
	return 100 * (level + 1);
}

const levelManager = new LevelManager();
export default levelManager;
