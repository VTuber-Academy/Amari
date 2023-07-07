import levelDatabase from './levelDataBase';

class LevelManager {
	async addXP(amount: number, toUserId: string) {
		return this.modifyXP(`+${amount}`, toUserId);
	}

	async removeXP(amount: number, toUserId: string) {
		return this.modifyXP(`-${amount}`, toUserId);
	}

	private async modifyXP(amountAsString: string, toUserId: string) {
		let userEntry = await levelDatabase.findOne({ id: toUserId });

		if (!userEntry) {
			userEntry = new levelDatabase({ id: toUserId, level: 0, experience: 0 });
		}

		const amount = Number(amountAsString);
		userEntry.experience += amount;

		const isLevelUp = this.levelUpCheck(userEntry.level, userEntry.experience);
		if (isLevelUp) {
			userEntry.level += 1;
			userEntry.experience = 0;
		}

		await userEntry.save();
		return isLevelUp;
	}

	private levelUpCheck(currentLevel: number, currentXP: number) {
		return this.calculateNextLevelXP(currentLevel) < currentXP;
	}

	private calculateNextLevelXP(currentLevel: number) {
		return 5 * (currentLevel ^ 2) + 50 * currentLevel + 100;
	}
}

const levelManager = new LevelManager();
export default levelManager;
