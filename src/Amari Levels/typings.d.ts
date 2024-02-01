declare module 'config.json' {
	interface config {
		messageCooldown: string;
		ignoreChannel: string[];
		roleRewards: string[]; // 0: first, 1: second, 3: third
		afkVC: string;
	}
}
