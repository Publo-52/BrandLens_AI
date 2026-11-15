import express from 'express';
import multer from 'multer';
import { Asset, ASSET_TYPES } from './asset.model.js';
import { ROLES } from '../members/membership.model.js';
import { authenticate, requireOrgAccess } from '../../middleware/auth.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
const router = express.Router({ mergeParams: true });

// POST /api/organisations/:organisationId/assets/upload - Upload asset file directly to Cloudinary
router.post('/upload', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'File is required for upload.', statusCode: 400 },
      });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: `brandlens/${req.params.organisationId}/assets`,
      resource_type: 'auto',
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
router.patch('/:assetId', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), async (req, res, next) => {
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
