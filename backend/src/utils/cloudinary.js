import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';
import { logger } from './logger.js';

// Configure Cloudinary SDK
if (config.cloudinaryUrl) {
  // If full CLOUDINARY_URL is present, configure using url (stripping angle brackets if any)
  const cleanUrl = config.cloudinaryUrl.replace(/<|>/g, '');
  process.env.CLOUDINARY_URL = cleanUrl;
  cloudinary.config({
    cloudinary_url: cleanUrl,
  });
} else {
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
    secure: true,
  });
}

/**
 * Uploads a buffer directly to Cloudinary using a stream.
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Cloudinary upload options (folder, resource_type, etc.)
 * @returns {Promise<Object>} Cloudinary upload result
 */
export async function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'brandlens_assets',
        resource_type: options.resourceType || 'auto',
        ...options,
      },
      (error, result) => {
        if (error) {
          logger.warn(`Cloudinary upload failed: ${error.message}`);
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

export { cloudinary };
