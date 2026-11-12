/** Longest side of a saved image, in pixels. */
const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.72;

/**
 * Resizes an image and re-encodes it as a JPEG data URL, so a phone screenshot of several MB
 * becomes roughly 100 to 200 KB before it is stored in the database.
 */
export const compressImage = async (file: File): Promise<string> => {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported');

    ctx.fillStyle = '#ffffff'; // JPEG has no transparency
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
};

/** Approximate size in bytes of a base64 data URL. Returns 0 for ordinary links. */
export const dataUrlBytes = (value: string): number =>
  value.startsWith('data:') ? Math.round(((value.length - value.indexOf(',') - 1) * 3) / 4) : 0;
