import {Schema, model} from 'mongoose';

type LevelProfileI = {
	discordId: string;
	level: number;
	experience: number;
	lastActivity: number;
};

const profileSchema = new Schema<LevelProfileI>({
	discordId: String,
	level: Number,
	experience: Number,
	lastActivity: Number,
});

const levelProfile = model<LevelProfileI>('User Levels', profileSchema);
export default levelProfile;
