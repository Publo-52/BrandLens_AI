import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';
import { logger } from './logger.js';

let isCloudinaryConfigured = false;

// Configure Cloudinary SDK only when real credentials are provided via environment variables
if (config.cloudinaryUrl && !config.cloudinaryUrl.includes('your_api_key')) {
  const cleanUrl = config.cloudinaryUrl.replace(/<|>/g, '');
  process.env.CLOUDINARY_URL = cleanUrl;
  cloudinary.config({
    cloudinary_url: cleanUrl,
    secure: true,
  });
  isCloudinaryConfigured = true;
} else if (config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
    secure: true,
  });
  isCloudinaryConfigured = true;
}

/**
 * Uploads a buffer directly to Cloudinary using a secure HTTPS stream.
 * Restricts resource types and forces safe upload parameters.
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Cloudinary upload options (folder, public_id, resourceType, etc.)
 * @returns {Promise<Object>} Cloudinary upload result
 */
export async function uploadToCloudinary(buffer, options = {}) {
  if (!isCloudinaryConfigured) {
    const err = new Error('Cloud asset storage is not configured in this environment.');
    err.statusCode = 503;
    throw err;
  }

  const allowedResourceTypes = new Set(['image', 'raw', 'auto']);
  const requestedType = options.resource_type || options.resourceType || 'auto';
  const safeResourceType = allowedResourceTypes.has(requestedType) ? requestedType : 'auto';
  const safeFolder = String(options.folder || 'brandlens_assets').replace(/[^a-zA-Z0-9/_-]/g, '_');

  const uploadOptions = {
    folder: safeFolder,
    resource_type: safeResourceType,
    use_filename: false,
    unique_filename: true,
    overwrite: false,
    ...(options.public_id
      ? { public_id: String(options.public_id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) }
      : {}),
  };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        logger.warn(`Cloudinary upload failed: ${error.message}`);
        return reject(error);
      }
      resolve(result);
    });
    uploadStream.end(buffer);
  });
}

export { cloudinary, isCloudinaryConfigured };
