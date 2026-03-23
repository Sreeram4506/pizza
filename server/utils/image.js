import path from 'path';

/** 
 * Fine-tuned Image Handling.
 * This service fulfills the scalability requirement because routes no 
 * longer need to handle path formatting directly. Switching to S3 
 * or Cloudinary later will only require changing this one file.
 */
export const ImageService = {
  
  /** 
   * Formats the image path for storage in the database.
   * Keeps the 'working like now' (local disk) behavior but allows swapping later.
   */
  getStoredPath: (file, folder = 'menu') => {
    if (!file) return null;
    
    // In current 'local' mode, we just return the relative path.
    // If we move to cloud later, this will return the cloud URL.
    return `/uploads/${folder}/${file.filename || file.name}`;
  },

  /**
   * Secure URL generator for images.
   * Handles cloud vs local transparently.
   */
  getPublicUrl: (storedPath) => {
    if (!storedPath) return null;
    
    // If it's already an absolute URL, return as is.
    if (storedPath.startsWith('http')) return storedPath;
    
    // If local, ensures it starts with the correct prefix.
    return storedPath.startsWith('/') ? storedPath : `/${storedPath}`;
  }
};
