import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dir, '../.env') });

const uri = process.env.MONGODB_URI;
console.log('Testing connection to:', uri);

try {
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected successfully!');
    process.exit(0);
} catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
}
