import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PREFIXED_LOCALES } from './locales';

const NAMESPACES = ['common', 'workspace', 'pages', 'seo'] as const;
const localesDir = path.resolve(__dirname, 'locales');

function load(code: string, ns: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(localesDir, code, `${ns}.json`), 'utf8'));
}

/** Leaf paths; arrays contribute their index so list lengths must match too. */
function leafPaths(node: unknown, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix];
  if (Array.isArray(node)) return node.flatMap((v, i) => leafPaths(v, `${prefix}[${i}]`));
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => leafPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [];
}

function placeholders(node: unknown, at: string): string[] {
  let cur: unknown = node;
  for (const part of at.split(/\.|\[(\d+)\]/).filter(Boolean)) {
    cur = (cur as Record<string, unknown>)?.[part];
  }
  return typeof cur === 'string' ? (cur.match(/\{\w+\}/g) ?? []).sort() : [];
}

describe('locale catalogs', () => {
  for (const code of PREFIXED_LOCALES) {
    for (const ns of NAMESPACES) {
      it(`${code}/${ns}.json has every English key with matching placeholders`, () => {
        const en = load('en', ns);
        const loc = load(code, ns);
        const locPaths = new Set(leafPaths(loc));
        const missing = leafPaths(en).filter((p) => !locPaths.has(p));
        expect(missing, `missing in ${code}/${ns}`).toEqual([]);
        const broken = leafPaths(en).filter(
          (p) => placeholders(en, p).join() !== placeholders(loc, p).join(),
        );
        expect(broken, `placeholder mismatch in ${code}/${ns}`).toEqual([]);
      });
    }
  }
});
