import { decode as decodeJpeg, encode as encodeJpeg } from 'jpeg-js';
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  decodePDFRawStream,
  type PDFPage,
} from 'pdf-lib';
import type { CompressPreset } from './compress-presets.js';

export interface ImageCompressStats {
  imagesSeen: number;
  imagesRecompressed: number;
  bytesSavedEstimate: number;
}

function asNameString(value: unknown): string | null {
  if (value instanceof PDFName) {
    const raw = value.asString();
    return raw.startsWith('/') ? raw.slice(1) : raw;
  }
  return null;
}

function listFilters(dict: PDFDict): string[] {
  const filter = dict.lookup(PDFName.of('Filter'));
  if (!filter) return [];
  if (filter instanceof PDFName) {
    const name = asNameString(filter);
    return name ? [name] : [];
  }
  if (filter instanceof PDFArray) {
    return filter
      .asArray()
      .map((entry) => asNameString(entry))
      .filter((name): name is string => Boolean(name));
  }
  return [];
}

function lookupNumber(dict: PDFDict, key: string): number | null {
  const value = dict.lookup(PDFName.of(key));
  if (value instanceof PDFNumber) return value.asNumber();
  return null;
}

function nearestResize(
  src: Uint8Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  channels: number,
): Uint8Array {
  const out = new Uint8Array(dstW * dstH * channels);
  for (let y = 0; y < dstH; y++) {
    const sy = Math.min(srcH - 1, Math.floor((y * srcH) / dstH));
    for (let x = 0; x < dstW; x++) {
      const sx = Math.min(srcW - 1, Math.floor((x * srcW) / dstW));
      const si = (sy * srcW + sx) * channels;
      const di = (y * dstW + x) * channels;
      for (let c = 0; c < channels; c++) {
        out[di + c] = src[si + c] ?? 0;
      }
    }
  }
  return out;
}

function grayToRgba(gray: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(width * height * 4);
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    const v = gray[i] ?? 0;
    out[p] = v;
    out[p + 1] = v;
    out[p + 2] = v;
    out[p + 3] = 255;
  }
  return out;
}

function rgbToRgba(rgb: Uint8Array, width: number, height: number): Uint8Array {
  const pixels = width * height;
  const out = new Uint8Array(pixels * 4);
  for (let i = 0, s = 0, d = 0; i < pixels; i++, s += 3, d += 4) {
    out[d] = rgb[s] ?? 0;
    out[d + 1] = rgb[s + 1] ?? 0;
    out[d + 2] = rgb[s + 2] ?? 0;
    out[d + 3] = 255;
  }
  return out;
}

function targetDimensions(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height };
  const scale = maxEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function encodeJpegRgba(
  rgba: Uint8Array,
  width: number,
  height: number,
  quality: number,
): Uint8Array {
  const encoded = encodeJpeg({ data: rgba, width, height }, quality);
  return encoded.data instanceof Uint8Array ? encoded.data : new Uint8Array(encoded.data);
}

function replaceWithJpeg(
  stream: PDFRawStream,
  jpegBytes: Uint8Array,
  width: number,
  height: number,
): number {
  const before = stream.contents.byteLength;
  const dict = stream.dict;
  // pdf-lib types mark contents readonly; runtime mutation is supported for recompress.
  (stream as { contents: Uint8Array }).contents = jpegBytes;
  dict.set(PDFName.of('Length'), PDFNumber.of(jpegBytes.byteLength));
  dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
  dict.delete(PDFName.of('DecodeParms'));
  dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
  dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
  dict.set(PDFName.of('Width'), PDFNumber.of(width));
  dict.set(PDFName.of('Height'), PDFNumber.of(height));
  dict.delete(PDFName.of('SMask'));
  return Math.max(0, before - jpegBytes.byteLength);
}

function tryRecompressImageStream(stream: PDFRawStream, preset: CompressPreset): number {
  const dict = stream.dict;
  const subtype = dict.lookup(PDFName.of('Subtype'));
  if (subtype !== PDFName.of('Image')) return 0;

  const width = lookupNumber(dict, 'Width');
  const height = lookupNumber(dict, 'Height');
  const bpc = lookupNumber(dict, 'BitsPerComponent') ?? 8;
  if (!width || !height || width < 1 || height < 1 || bpc !== 8) return 0;

  const filters = listFilters(dict);
  const colorSpace = asNameString(dict.lookup(PDFName.of('ColorSpace')));
  const target = targetDimensions(width, height, preset.maxImageEdge);

  try {
    if (filters.includes('DCTDecode') && filters.length === 1) {
      const decoded = decodeJpeg(stream.contents, { useTArray: true });
      let rgba = decoded.data instanceof Uint8Array ? decoded.data : new Uint8Array(decoded.data);
      let w = decoded.width;
      let h = decoded.height;
      if (w !== target.width || h !== target.height) {
        rgba = nearestResize(rgba, w, h, target.width, target.height, 4);
        w = target.width;
        h = target.height;
      }
      const jpeg = encodeJpegRgba(rgba, w, h, preset.jpegQuality);
      if (jpeg.byteLength >= stream.contents.byteLength && w === width && h === height) {
        return 0;
      }
      return replaceWithJpeg(stream, jpeg, w, h);
    }

    if (
      filters.includes('FlateDecode') &&
      !filters.includes('DCTDecode') &&
      (colorSpace === 'DeviceRGB' || colorSpace === 'DeviceGray')
    ) {
      const decoded = decodePDFRawStream(stream);
      const rawBytes = decoded.decode();
      const raw = rawBytes instanceof Uint8Array ? rawBytes : new Uint8Array(rawBytes);
      const channels = colorSpace === 'DeviceGray' ? 1 : 3;
      const expected = width * height * channels;
      if (raw.byteLength < expected) return 0;

      let rgba =
        channels === 1
          ? grayToRgba(raw.subarray(0, expected), width, height)
          : rgbToRgba(raw.subarray(0, expected), width, height);
      let w = width;
      let h = height;
      if (w !== target.width || h !== target.height) {
        rgba = nearestResize(rgba, w, h, target.width, target.height, 4);
        w = target.width;
        h = target.height;
      }
      const jpeg = encodeJpegRgba(rgba, w, h, preset.jpegQuality);
      if (jpeg.byteLength >= stream.contents.byteLength && w === width && h === height) {
        return 0;
      }
      return replaceWithJpeg(stream, jpeg, w, h);
    }
  } catch {
    return 0;
  }

  return 0;
}

function visitXObjectDict(
  xObjectDict: PDFDict,
  preset: CompressPreset,
  seen: Set<string>,
  stats: ImageCompressStats,
): void {
  const entries = xObjectDict.entries();
  for (const [, value] of entries) {
    let stream: PDFRawStream | null = null;
    let refKey: string | null = null;

    if (value instanceof PDFRef) {
      refKey = `${value.objectNumber} ${value.generationNumber}`;
      if (seen.has(refKey)) continue;
      seen.add(refKey);
      const lookedUp = xObjectDict.context.lookup(value);
      if (lookedUp instanceof PDFRawStream) stream = lookedUp;
      else if (lookedUp instanceof PDFDict) {
        const subtype = lookedUp.lookup(PDFName.of('Subtype'));
        if (subtype === PDFName.of('Form')) {
          const resources = lookedUp.lookup(PDFName.of('Resources'));
          if (resources instanceof PDFDict) {
            const nested = resources.lookup(PDFName.of('XObject'));
            if (nested instanceof PDFDict) visitXObjectDict(nested, preset, seen, stats);
          }
        }
        continue;
      }
    } else if (value instanceof PDFRawStream) {
      stream = value;
    }

    if (!stream) continue;

    const subtype = stream.dict.lookup(PDFName.of('Subtype'));
    if (subtype === PDFName.of('Form')) {
      const resources = stream.dict.lookup(PDFName.of('Resources'));
      if (resources instanceof PDFDict) {
        const nested = resources.lookup(PDFName.of('XObject'));
        if (nested instanceof PDFDict) visitXObjectDict(nested, preset, seen, stats);
      }
      continue;
    }

    if (subtype !== PDFName.of('Image')) continue;
    stats.imagesSeen += 1;
    const saved = tryRecompressImageStream(stream, preset);
    if (saved > 0) {
      stats.imagesRecompressed += 1;
      stats.bytesSavedEstimate += saved;
    }
  }
}

function visitPageImages(page: PDFPage, preset: CompressPreset, seen: Set<string>, stats: ImageCompressStats): void {
  const resources = page.node.Resources();
  if (!(resources instanceof PDFDict)) return;
  const xObject = resources.lookup(PDFName.of('XObject'));
  if (xObject instanceof PDFDict) {
    visitXObjectDict(xObject, preset, seen, stats);
  }
}

/** Recompress embedded raster images in-place. Vector/text content is left intact. */
export function recompressEmbeddedImages(
  doc: PDFDocument,
  preset: CompressPreset,
  signal?: AbortSignal,
): ImageCompressStats | { aborted: true } {
  const stats: ImageCompressStats = {
    imagesSeen: 0,
    imagesRecompressed: 0,
    bytesSavedEstimate: 0,
  };
  const seen = new Set<string>();
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    if (signal?.aborted) return { aborted: true };
    visitPageImages(pages[i]!, preset, seen, stats);
  }
  return stats;
}
