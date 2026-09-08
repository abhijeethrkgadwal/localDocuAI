/** Compression strength — lower = smaller files, more quality loss. */
export const CompressQuality = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type CompressQuality = (typeof CompressQuality)[keyof typeof CompressQuality];

/**
 * Mode:
 * - balanced: recompress embedded images + rewrite streams (keeps selectable text)
 * - maximum: rasterize pages to JPEG (stronger size wins; text becomes an image)
 */
export const CompressMode = {
  BALANCED: 'balanced',
  MAXIMUM: 'maximum',
} as const;

export type CompressMode = (typeof CompressMode)[keyof typeof CompressMode];

export interface CompressPreset {
  /** JPEG quality 1–100 for recompression / raster output */
  jpegQuality: number;
  /** Max long-edge pixels for embedded images (balanced) */
  maxImageEdge: number;
  /** pdf.js render scale for maximum mode (relative to 72dpi CSS px) */
  rasterScale: number;
}

export const COMPRESS_PRESETS: Record<CompressQuality, CompressPreset> = {
  low: { jpegQuality: 40, maxImageEdge: 1024, rasterScale: 1.0 },
  medium: { jpegQuality: 60, maxImageEdge: 1400, rasterScale: 1.35 },
  high: { jpegQuality: 78, maxImageEdge: 2000, rasterScale: 1.75 },
};
