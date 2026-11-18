import express from 'express';
import multer from 'multer';
import { Asset, ASSET_TYPES } from './asset.model.js';
import { ROLES } from '../members/membership.model.js';
import { authenticate, requireOrgAccess } from '../../middleware/auth.js';
import { validateObjectIdParam } from '../../middleware/security.js';
import { uploadRateLimiter } from '../../middleware/rateLimiter.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';
import { validateUploadedFile, MAX_UPLOAD_SIZE_BYTES } from '../../utils/fileValidation.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES, files: 1 },
});
const router = express.Router({ mergeParams: true });

// POST /api/organisations/:organisationId/assets/upload - Upload asset file directly to Cloudinary
router.post(
  '/upload',
  authenticate,
  requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]),
  uploadRateLimiter,
  upload.single('file'),
  async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'File is required for upload.', statusCode: 400 },
      });
    }

    // Strict asset file validation (blocks SVG/HTML/JS XSS vectors and spoofed MIME types)
    const validation = validateUploadedFile(req.file, { mode: 'asset' });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { message: validation.error, statusCode: 400 },
      });
    }

    const resourceType = validation.ext === '.pdf' ? 'raw' : 'image';
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: `brandlens/${req.params.organisationId}/assets`,
      resource_type: resourceType,
      public_id: `${Date.now()}_${validation.safeName.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    });

    res.status(201).json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/organisations/:organisationId/assets - List brand visual assets
router.get('/', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { organisationId: req.params.organisationId, isActive: true };

    if (type && Object.values(ASSET_TYPES).includes(type)) {
      filter.type = type;
    }

    const assets = await Asset.find(filter)
      .populate('ownerId', 'name email')
      .sort({ type: 1, createdAt: -1 });

    res.json({
      success: true,
      assets,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/organisations/:organisationId/assets - Register brand asset (palettes, fonts, logos) (ADMIN, MANAGER)
router.post('/', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), async (req, res, next) => {
  try {
    const { name, type = ASSET_TYPES.PALETTE, secureUrl, metadata } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Asset name is required.', statusCode: 400 },
      });
    }

    const asset = await Asset.create({
      organisationId: req.params.organisationId,
      name: name.trim(),
      type: type || ASSET_TYPES.PALETTE,
      secureUrl: secureUrl?.trim() || '',
      metadata: metadata || {},
      ownerId: req.user._id,
      version: 1,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      asset,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/organisations/:organisationId/assets/:assetId - Update asset
router.patch('/:assetId', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), validateObjectIdParam('assetId'), async (req, res, next) => {
  try {
    const { name, metadata, secureUrl, isActive } = req.body;
    const asset = await Asset.findOne({
      _id: req.params.assetId,
      organisationId: req.params.organisationId,
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: { message: 'Asset not found.', statusCode: 404 },
      });
    }

    if (name) asset.name = name.trim();
    if (metadata) asset.metadata = metadata;
    if (secureUrl !== undefined) asset.secureUrl = secureUrl;
    if (isActive !== undefined) asset.isActive = Boolean(isActive);

    asset.version += 1;
    await asset.save();

    res.json({
      success: true,
      asset,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
