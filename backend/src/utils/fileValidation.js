import path from 'path';

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const CONTENT_ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'text/plain',
]);

export const CONTENT_ALLOWED_EXTS = new Set([
  '.pdf',
  '.docx',
  '.doc',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.txt',
]);

// Brand assets: strictly safe raster images & PDFs (explicitly blocks SVG/HTML/JS XSS vectors)
export const ASSET_ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export const ASSET_ALLOWED_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
]);

/**
 * Sanitizes an uploaded filename to prevent path traversal and special-character injection.
 */
export function sanitizeFilename(originalName = 'file') {
  const base = path.basename(String(originalName)).replace(/\0/g, '');
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '.');
  return safe.slice(0, 120) || 'uploaded_file';
}

/**
 * Inspects file magic bytes to verify the binary header matches the declared extension.
 */
export function matchesMagicBytes(buffer, ext) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return false;

  switch (ext) {
    case '.pdf':
      return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    case '.png':
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    case '.jpg':
    case '.jpeg':
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case '.webp':
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    case '.docx':
      // ZIP archive signature: PK\x03\x04 or empty ZIP PK\x05\x06
      return (
        buffer.length >= 4 &&
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        (buffer[2] === 0x03 || buffer[2] === 0x05)
      );
    case '.doc':
      // OLE2 Compound Document signature
      return (
        buffer.length >= 4 &&
        buffer[0] === 0xd0 &&
        buffer[1] === 0xcf &&
        buffer[2] === 0x11 &&
        buffer[3] === 0xe0
      );
    case '.txt':
      // Plain text must not contain NUL bytes
      return !buffer.includes(0x00);
    default:
      return false;
  }
}

/**
 * Validates an uploaded Multer file against extension, MIME type, size limit, and magic bytes.
 * Returns { valid: true, safeName, ext } or { valid: false, error }.
 */
export function validateUploadedFile(file, { mode = 'content' } = {}) {
  if (!file || !file.buffer) {
    return { valid: false, error: 'Uploaded file is missing or empty.' };
  }

  const safeName = sanitizeFilename(file.originalname);
  const ext = path.extname(safeName).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase().trim();

  const allowedExts = mode === 'asset' ? ASSET_ALLOWED_EXTS : CONTENT_ALLOWED_EXTS;
  const allowedMimes = mode === 'asset' ? ASSET_ALLOWED_MIMES : CONTENT_ALLOWED_MIMES;

  // Require BOTH extension AND MIME type to be explicitly allowed (prevents spoofing)
  if (!ext || !allowedExts.has(ext) || !allowedMimes.has(mime)) {
    const allowedLabel = mode === 'asset' ? 'PNG, JPG, WebP, and PDF' : 'PDF, DOCX, JPG, PNG, WebP, and TXT';
    return {
      valid: false,
      error: `Unsupported or mismatched file format for "${safeName}". Allowed formats: ${allowedLabel}.`,
    };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES || file.buffer.length > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${safeName}" exceeds the 10MB size limit.`,
    };
  }

  if (!matchesMagicBytes(file.buffer, ext)) {
    return {
      valid: false,
      error: `File signature verification failed for "${safeName}". File contents do not match the ${ext} format.`,
    };
  }

  return { valid: true, safeName, ext };
}
