import { join } from 'path';

export const rootDir = join(__dirname, '../..', '..');
export const srcDir = join(rootDir, 'src');
console.log(srcDir);
export const RandomLoadingMessage = ['Computing...', 'Thinking...', 'Cooking some food', 'Give me a moment', 'Loading...'];
