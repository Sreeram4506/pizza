import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dir, '../../.env') });

if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a file buffer to Cloudinary via streams.
 * @param {Buffer} buffer The file buffer (from multer memoryStorage)
 * @param {String} folder The folder in cloudinary (e.g. "pizzablast/menu")
 * @returns {Promise<String>} The secure URL of the uploaded image
 */
export const uploadToCloudinary = (buffer, folder = 'pizzablast/menu') => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME && !process.env.CLOUDINARY_URL) {
      return reject(new Error('Cloudinary environment variables are missing! Upload failed.'));
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (result) {
          resolve(result.secure_url);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};
