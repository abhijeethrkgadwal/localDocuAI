import { LocalizedLink } from '../components/LocalizedLink';
import { getEnglishCatalog } from '../i18n';
import type { MessageTree } from '../i18n/translate';
import {
  FAQ_ITEMS,
  getFaqItemsFromPages,
  getHowItWorksSteps,
  getWhyLocalMatters,
  type FaqItem,
} from './seoContent';
import { GITHUB_URL, SITE_PATHS } from './siteConfig';

export type PublicPageId =
  | 'merge-pdf'
  | 'merge-docx'
  | 'compress-pdf'
  | 'pdf-tools'
  | 'docx-to-pdf'
  | 'offline'
  | 'privacy'
  | 'how-it-works'
  | 'browser-support'
  | 'open-source'
  | 'contribute'
  | 'roadmap'
  | 'desktop'
  | 'local-ai'
  | 'faq';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'note'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][]; caption?: string }
  | { type: 'links'; items: { label: string; to?: string; href?: string }[] }
  | { type: 'faq'; items?: FaqItem[] };

const PUBLIC_PAGE_IDS: PublicPageId[] = [
  'merge-pdf',
  'merge-docx',
  'compress-pdf',
  'pdf-tools',
  'docx-to-pdf',
  'offline',
  'privacy',
  'how-it-works',
  'browser-support',
  'open-source',
  'contribute',
  'roadmap',
  'desktop',
  'local-ai',
  'faq',
];

/** Map PublicPageId (kebab-case) → pages catalog key (camelCase). */
export function publicPageCatalogKey(pageId: PublicPageId): string {
  if (pageId === 'faq') return 'faqPage';
  return pageId.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
}

function asStringMatrix(value: unknown): string[][] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => asStringArray(row));
}

const LINK_TARGETS: Record<string, { to?: string; href?: string }> = {
  browserSupport: { to: SITE_PATHS.browserSupport },
  pdfTools: { to: SITE_PATHS.pdfTools },
  compressPdf: { to: SITE_PATHS.compressPdf },
  privacy: { to: SITE_PATHS.privacy },
  offline: { to: SITE_PATHS.offline },
  docxToPdf: { to: SITE_PATHS.docxToPdf },
  howItWorks: { to: SITE_PATHS.howItWorks },
  mergePdfs: { to: SITE_PATHS.mergePdf },
  faq: { to: SITE_PATHS.faq },
  mergeDocx: { to: SITE_PATHS.mergeDocx },
  desktop: { to: SITE_PATHS.desktop },
  localAi: { to: SITE_PATHS.localAi },
  contribute: { to: SITE_PATHS.contribute },
  roadmap: { to: SITE_PATHS.roadmap },
  openSource: { to: SITE_PATHS.openSource },
  openLocalDocu: { to: SITE_PATHS.home },
  openWeb: { to: SITE_PATHS.home },
  github: { href: GITHUB_URL },
  contributing: { href: `${GITHUB_URL}/blob/main/CONTRIBUTING.md` },
  codeOfConduct: { href: `${GITHUB_URL}/blob/main/CODE_OF_CONDUCT.md` },
  security: { href: `${GITHUB_URL}/blob/main/SECURITY.md` },
};

function mapLinks(links: unknown): Block | null {
  const record = asRecord(links);
  if (!record) return null;
  const items: { label: string; to?: string; href?: string }[] = [];
  for (const [key, label] of Object.entries(record)) {
    if (typeof label !== 'string') continue;
    const target = LINK_TARGETS[key];
    if (!target) continue;
    items.push({ label, ...target });
  }
  return items.length ? { type: 'links', items } : null;
}

function pushIfLinks(blocks: Block[], links: unknown): void {
  const block = mapLinks(links);
  if (block) blocks.push(block);
}

function pageNode(
  catalogPages: MessageTree | Record<string, unknown>,
  pageId: PublicPageId,
): Record<string, unknown> {
  const key = publicPageCatalogKey(pageId);
  return asRecord((catalogPages as Record<string, unknown>)[key]) ?? {};
}

export function getPublicPageBlocks(
  pageId: PublicPageId,
  catalogPages: MessageTree | Record<string, unknown>,
): Block[] {
  const pages = catalogPages as Record<string, unknown>;
  const page = pageNode(pages, pageId);
  const blocks: Block[] = [];

  switch (pageId) {
    case 'merge-pdf': {
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.howToHeading)) blocks.push({ type: 'h2', text: asString(page.howToHeading)! });
      if (asStringArray(page.howTo).length) blocks.push({ type: 'ol', items: asStringArray(page.howTo) });
      if (asString(page.privacyHeading))
        blocks.push({ type: 'h2', text: asString(page.privacyHeading)! });
      if (asStringArray(page.privacy).length)
        blocks.push({ type: 'ul', items: asStringArray(page.privacy) });
      if (asString(page.note)) blocks.push({ type: 'note', text: asString(page.note)! });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'merge-docx': {
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.behaviorHeading))
        blocks.push({ type: 'h2', text: asString(page.behaviorHeading)! });
      if (asStringArray(page.behavior).length)
        blocks.push({ type: 'ul', items: asStringArray(page.behavior) });
      if (asString(page.limitsHeading))
        blocks.push({ type: 'h2', text: asString(page.limitsHeading)! });
      if (asStringArray(page.limits).length)
        blocks.push({ type: 'ul', items: asStringArray(page.limits) });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'compress-pdf': {
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.modesHeading)) blocks.push({ type: 'h2', text: asString(page.modesHeading)! });
      if (asStringArray(page.modes).length)
        blocks.push({ type: 'ul', items: asStringArray(page.modes) });
      if (asString(page.privacyHeading))
        blocks.push({ type: 'h2', text: asString(page.privacyHeading)! });
      if (asStringArray(page.privacy).length)
        blocks.push({ type: 'ul', items: asStringArray(page.privacy) });
      if (asString(page.note)) blocks.push({ type: 'note', text: asString(page.note)! });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'pdf-tools': {
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.opsHeading)) blocks.push({ type: 'h2', text: asString(page.opsHeading)! });
      if (asStringArray(page.ops).length) blocks.push({ type: 'ul', items: asStringArray(page.ops) });
      if (asString(page.outro)) blocks.push({ type: 'p', text: asString(page.outro)! });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'docx-to-pdf': {
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.limitsHeading))
        blocks.push({ type: 'h2', text: asString(page.limitsHeading)! });
      if (asStringArray(page.limits).length)
        blocks.push({ type: 'ul', items: asStringArray(page.limits) });
      if (asString(page.noteFidelity))
        blocks.push({ type: 'note', text: asString(page.noteFidelity)! });
      if (asString(page.notePhones)) blocks.push({ type: 'note', text: asString(page.notePhones)! });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'offline': {
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.worksHeading)) blocks.push({ type: 'h2', text: asString(page.worksHeading)! });
      if (asStringArray(page.works).length)
        blocks.push({ type: 'ul', items: asStringArray(page.works) });
      if (asString(page.refreshHeading))
        blocks.push({ type: 'h2', text: asString(page.refreshHeading)! });
      if (asStringArray(page.refresh).length)
        blocks.push({ type: 'ul', items: asStringArray(page.refresh) });
      if (asString(page.varyHeading)) blocks.push({ type: 'h2', text: asString(page.varyHeading)! });
      if (asStringArray(page.vary).length)
        blocks.push({ type: 'ul', items: asStringArray(page.vary) });
      if (asString(page.outro)) blocks.push({ type: 'p', text: asString(page.outro)! });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'privacy': {
      if (asString(page.staysLocalHeading))
        blocks.push({ type: 'h2', text: asString(page.staysLocalHeading)! });
      if (asStringArray(page.staysLocal).length)
        blocks.push({ type: 'ul', items: asStringArray(page.staysLocal) });
      if (asString(page.doesNotHeading))
        blocks.push({ type: 'h2', text: asString(page.doesNotHeading)! });
      if (asStringArray(page.doesNot).length)
        blocks.push({ type: 'ul', items: asStringArray(page.doesNot) });
      if (asString(page.dataFlowHeading))
        blocks.push({ type: 'h2', text: asString(page.dataFlowHeading)! });
      if (asStringArray(page.dataFlow).length)
        blocks.push({ type: 'ol', items: asStringArray(page.dataFlow) });
      if (asString(page.laterHeading))
        blocks.push({ type: 'h2', text: asString(page.laterHeading)! });
      if (asStringArray(page.later).length)
        blocks.push({ type: 'ul', items: asStringArray(page.later) });
      if (asString(page.note)) blocks.push({ type: 'note', text: asString(page.note)! });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'how-it-works': {
      const steps = getHowItWorksSteps(pages);
      const whyLocal = getWhyLocalMatters(pages);
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.stepsHeading))
        blocks.push({ type: 'h2', text: asString(page.stepsHeading)! });
      if (steps.length) {
        blocks.push({
          type: 'ol',
          items: steps.map((s) => `${s.name}. ${s.text}`),
        });
      }
      if (asString(page.devicesHeading))
        blocks.push({ type: 'h2', text: asString(page.devicesHeading)! });
      if (asStringArray(page.devices).length)
        blocks.push({ type: 'ul', items: asStringArray(page.devices) });
      if (whyLocal.title) blocks.push({ type: 'h2', text: whyLocal.title });
      if (whyLocal.points.length) blocks.push({ type: 'ul', items: whyLocal.points });
      if (asString(page.framing)) blocks.push({ type: 'p', text: asString(page.framing)! });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'browser-support': {
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.positioningHeading))
        blocks.push({ type: 'h2', text: asString(page.positioningHeading)! });
      if (asStringArray(page.positioning).length)
        blocks.push({ type: 'ul', items: asStringArray(page.positioning) });
      if (asString(page.matrixHeading))
        blocks.push({ type: 'h2', text: asString(page.matrixHeading)! });
      {
        const headers = asStringArray(page.headers);
        const rows = asStringMatrix(page.rows);
        if (headers.length && rows.length) {
          blocks.push({
            type: 'table',
            headers,
            rows,
            caption: asString(page.tableCaption),
          });
        }
      }
      if (asString(page.footnote)) blocks.push({ type: 'p', text: asString(page.footnote)! });
      if (asString(page.mobileHeading))
        blocks.push({ type: 'h2', text: asString(page.mobileHeading)! });
      if (asStringArray(page.mobile).length)
        blocks.push({ type: 'ol', items: asStringArray(page.mobile) });
      if (asString(page.note)) blocks.push({ type: 'note', text: asString(page.note)! });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'open-source': {
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.openMeansHeading))
        blocks.push({ type: 'h2', text: asString(page.openMeansHeading)! });
      if (asStringArray(page.openMeans).length)
        blocks.push({ type: 'ul', items: asStringArray(page.openMeans) });
      if (asString(page.note)) blocks.push({ type: 'note', text: asString(page.note)! });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'contribute': {
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.journeyHeading))
        blocks.push({ type: 'h2', text: asString(page.journeyHeading)! });
      if (asStringArray(page.journey).length)
        blocks.push({ type: 'ol', items: asStringArray(page.journey) });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'roadmap': {
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.shippedHeading))
        blocks.push({ type: 'h2', text: asString(page.shippedHeading)! });
      if (asStringArray(page.shipped).length)
        blocks.push({ type: 'ul', items: asStringArray(page.shipped) });
      if (asString(page.nextHeading)) blocks.push({ type: 'h2', text: asString(page.nextHeading)! });
      if (asStringArray(page.next).length)
        blocks.push({ type: 'ul', items: asStringArray(page.next) });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'desktop': {
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.directionHeading))
        blocks.push({ type: 'h2', text: asString(page.directionHeading)! });
      if (asStringArray(page.direction).length)
        blocks.push({ type: 'ul', items: asStringArray(page.direction) });
      if (asString(page.note)) blocks.push({ type: 'note', text: asString(page.note)! });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'local-ai': {
      if (asString(page.intro)) blocks.push({ type: 'p', text: asString(page.intro)! });
      if (asString(page.designedHeading))
        blocks.push({ type: 'h2', text: asString(page.designedHeading)! });
      if (asStringArray(page.designed).length)
        blocks.push({ type: 'ul', items: asStringArray(page.designed) });
      if (asString(page.modelHeading))
        blocks.push({ type: 'h2', text: asString(page.modelHeading)! });
      if (asStringArray(page.model).length)
        blocks.push({ type: 'ol', items: asStringArray(page.model) });
      if (asString(page.note)) blocks.push({ type: 'note', text: asString(page.note)! });
      pushIfLinks(blocks, page.links);
      break;
    }
    case 'faq': {
      const faq = asRecord(pages.faq);
      const subtitle = asString(faq?.subtitle);
      if (subtitle) blocks.push({ type: 'p', text: subtitle });
      blocks.push({ type: 'faq', items: getFaqItemsFromPages(pages) });
      pushIfLinks(blocks, page.links);
      break;
    }
    default:
      break;
  }

  return blocks;
}

/** Lazy English snapshot for tests (built from getEnglishCatalog().pages). */
function buildEnglishPublicPageBlocks(): Record<PublicPageId, Block[]> {
  const pages = getEnglishCatalog().pages;
  const result = {} as Record<PublicPageId, Block[]>;
  for (const id of PUBLIC_PAGE_IDS) {
    result[id] = getPublicPageBlocks(id, pages);
  }
  return result;
}

let englishBlocksCache: Record<PublicPageId, Block[]> | undefined;

export const PUBLIC_PAGE_BLOCKS: Record<PublicPageId, Block[]> = new Proxy(
  {} as Record<PublicPageId, Block[]>,
  {
    get(_target, prop: string | symbol) {
      if (typeof prop !== 'string') return undefined;
      if (!englishBlocksCache) englishBlocksCache = buildEnglishPublicPageBlocks();
      return englishBlocksCache[prop as PublicPageId];
    },
    ownKeys() {
      if (!englishBlocksCache) englishBlocksCache = buildEnglishPublicPageBlocks();
      return Reflect.ownKeys(englishBlocksCache);
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (!englishBlocksCache) englishBlocksCache = buildEnglishPublicPageBlocks();
      if (typeof prop === 'string' && prop in englishBlocksCache) {
        return {
          configurable: true,
          enumerable: true,
          value: englishBlocksCache[prop as PublicPageId],
        };
      }
      return undefined;
    },
    has(_target, prop) {
      if (!englishBlocksCache) englishBlocksCache = buildEnglishPublicPageBlocks();
      return typeof prop === 'string' && prop in englishBlocksCache;
    },
  },
);

export function renderPublicBlocks(blocks: Block[]) {
  return blocks.map((block, index) => {
    switch (block.type) {
      case 'p':
        return (
          <p key={index} className="leading-relaxed">
            {block.text}
          </p>
        );
      case 'h2':
        return (
          <h2
            key={index}
            className="pt-2 text-base font-semibold text-[var(--text-primary)]"
          >
            {block.text}
          </h2>
        );
      case 'ul':
        return (
          <ul key={index} className="list-disc space-y-1.5 pl-5">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol key={index} className="list-decimal space-y-1.5 pl-5">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        );
      case 'note':
        return (
          <p
            key={index}
            className="rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-[var(--text-secondary)]"
          >
            {block.text}
          </p>
        );
      case 'table':
        return (
          <div key={index} className="overflow-x-auto pt-1">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm text-[var(--text-secondary)]">
              <caption className="sr-only">
                {block.caption ?? 'Browser and device capability matrix'}
              </caption>
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {block.headers.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-2 py-2 font-semibold text-[var(--text-primary)]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join('|')} className="border-b border-[var(--border)] align-top">
                    {row.map((cell, cellIndex) =>
                      cellIndex === 0 ? (
                        <th
                          key={`${row[0]}-${cellIndex}`}
                          scope="row"
                          className="px-2 py-2 font-medium text-[var(--text-primary)]"
                        >
                          {cell}
                        </th>
                      ) : (
                        <td key={`${row[0]}-${cellIndex}`} className="px-2 py-2">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'links':
        return (
          <ul key={index} className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            {block.items.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <a
                    className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <LocalizedLink
                    className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                    to={item.to!}
                  >
                    {item.label}
                  </LocalizedLink>
                )}
              </li>
            ))}
          </ul>
        );
      case 'faq': {
        const items = block.items?.length ? block.items : FAQ_ITEMS;
        return (
          <div key={index} className="space-y-3">
            {items.map((item) => (
              <details
                key={item.id}
                id={item.id}
                className="rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3"
              >
                <summary className="cursor-pointer font-medium text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.answer}</p>
              </details>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  });
}
