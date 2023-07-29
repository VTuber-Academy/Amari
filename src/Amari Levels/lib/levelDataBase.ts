import { Schema, model } from 'mongoose';

export interface LevelsInterface {
	id: string;
	level: number;
	experience: number;
	lastActivity?: Date;
}

const levelSchema = new Schema<LevelsInterface>({
	id: { type: String, required: true },
	level: { type: Number, default: 0 },
	experience: { type: Number, default: 0 },
	lastActivity: { type: Number, default: new Date() }
});

const levelDatabase = model<LevelsInterface>('Amari Levels', levelSchema);
export default levelDatabase;
