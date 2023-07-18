import { Schema, model } from 'mongoose';

export interface levelsInterface {
	id: string;
	level: number;
	experience: number;
	lastActivity?: Date;
}

const levelSchema = new Schema<levelsInterface>({
	id: String,
	level: Number,
	experience: Number,
	lastActivity: Date
});

const levelDatabase = model<levelsInterface>('Levels', levelSchema);
export default levelDatabase;
