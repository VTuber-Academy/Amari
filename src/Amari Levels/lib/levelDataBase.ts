import { Schema, model } from 'mongoose';

export interface levelsInterface {
	id: string;
	level: number;
	experience: number;
}

const levelSchema = new Schema<levelsInterface>({
	id: String,
	level: Number,
	experience: Number
});

const levelDatabase = model<levelsInterface>('Levels', levelSchema);
export default levelDatabase;
