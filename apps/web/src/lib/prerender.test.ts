import { describe, expect, it } from 'vitest';
import { LOCALE_CODES, type LocaleCode } from '../i18n/locales';
import { getEnglishCatalog, type Catalog } from '../i18n/catalog';
import { escapeHtml, outputFileFor, prerenderAll, safeJsonForScript } from './prerender';
import { ROUTE_PATHS } from './routeMeta';

const TEMPLATE = `<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <!--seo:head-->
    <title>placeholder</title>
    <!--/seo:head-->
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <div id="root"></div>
    <noscript><p>old</p></noscript>
  </body>
</html>`;

const SITE = 'https://example.test';
const en = getEnglishCatalog();
const catalogs = Object.fromEntries(LOCALE_CODES.map((c) => [c, en])) as Record<LocaleCode, Catalog>;
const files = new Map(prerenderAll(TEMPLATE, ROUTE_PATHS, catalogs, SITE).map((f) => [f.fileName, f.html]));

function jsonLd(html: string): { '@graph': { '@type': string | string[] }[] } {
  const match = html.match(/<script type="application\/ld\+json" id="ld-json">([\s\S]*?)<\/script>/);
  expect(match).not.toBeNull();
  return JSON.parse(match![1]!);
}

function types(html: string): string[] {
  return jsonLd(html)['@graph'].flatMap((n) => n['@type']);
}

describe('prerender', () => {
  it('emits every route × locale plus 404', () => {
    expect(files.size).toBe(ROUTE_PATHS.length * LOCALE_CODES.length + 1);
    expect(files.has('index.html')).toBe(true);
    expect(files.has('es.html')).toBe(true);
    expect(files.has('es/merge-pdf.html')).toBe(true);
    expect(files.has('guides/compress-pdf-offline.html')).toBe(true);
    expect(files.has('ja/guides/compress-pdf-offline.html')).toBe(true);
    expect(files.has('404.html')).toBe(true);
  });

  it('maps paths to clean-URL file names', () => {
    expect(outputFileFor('/', 'en')).toBe('index.html');
    expect(outputFileFor('/', 'de')).toBe('de.html');
    expect(outputFileFor('/merge-pdf', 'en')).toBe('merge-pdf.html');
    expect(outputFileFor('/guides/x', 'fr')).toBe('fr/guides/x.html');
  });

  it('writes a complete, page-specific head', () => {
    const html = files.get('es/merge-pdf.html')!;
    expect(html).toContain('<html lang="es" dir="ltr">');
    expect(html).toContain(`<link rel="canonical" href="${SITE}/es/merge-pdf" />`);
    expect(html).toContain(`hreflang="x-default" href="${SITE}/merge-pdf"`);
    expect(html).toContain(`hreflang="pt-BR" href="${SITE}/pt/merge-pdf"`);
    expect(html).toContain(`<meta property="og:image" content="${SITE}/og/merge-pdf.png" />`);
    expect(html).toContain('<meta property="og:locale" content="es" />');
    expect(html).not.toContain('placeholder');
    expect(html.match(/<title>/g)).toHaveLength(1);
  });

  it('renders readable body content with the H1 and FAQ', () => {
    const html = files.get('merge-pdf.html')!;
    expect(html).toMatch(/<h1[^>]*>Merge PDF files without uploading them<\/h1>/);
    expect(html).toContain('<main id="main-content"');
    expect(html).toContain('Can I merge PDF files without uploading them?');
    expect(html).toContain('href="/compress-pdf"');
    expect(html).not.toContain('<noscript><p>old</p></noscript>');
  });

  it('uses structured data that matches the page type', () => {
    expect(types(files.get('index.html')!)).toEqual(
      expect.arrayContaining(['Organization', 'WebSite', 'WebApplication', 'HowTo', 'FAQPage']),
    );
    expect(types(files.get('rotate-pdf.html')!)).toEqual(
      expect.arrayContaining(['WebApplication', 'HowTo', 'FAQPage', 'BreadcrumbList']),
    );
    expect(types(files.get('ilovepdf-alternative.html')!)).toEqual(
      expect.arrayContaining(['Article', 'FAQPage', 'BreadcrumbList']),
    );
    expect(types(files.get('guides.html')!)).toContain('CollectionPage');
  });

  it('marks the 404 page noindex with no canonical or JSON-LD', () => {
    const html = files.get('404.html')!;
    expect(html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain('application/ld+json');
  });

  it('escapes text and script payloads', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
    expect(safeJsonForScript({ v: '</script><!--' })).not.toMatch(/<\/script>|<!--/);
  });
});
