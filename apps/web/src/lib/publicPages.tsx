import { Link } from 'react-router-dom';
import {
  FAQ_ITEMS,
  FAQ_SUBTITLE,
  HOW_IT_WORKS_STEPS,
  WHY_LOCAL_MATTERS,
} from './seoContent';
import { GITHUB_URL, SITE, SITE_PATHS } from './siteConfig';

export type PublicPageId =
  | 'merge-pdf'
  | 'merge-docx'
  | 'pdf-tools'
  | 'docx-to-pdf'
  | 'offline'
  | 'privacy'
  | 'how-it-works'
  | 'open-source'
  | 'contribute'
  | 'roadmap'
  | 'desktop'
  | 'local-ai'
  | 'faq';

type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'note'; text: string }
  | { type: 'links'; items: { label: string; to?: string; href?: string }[] }
  | { type: 'faq' };

export const PUBLIC_PAGE_BLOCKS: Record<PublicPageId, Block[]> = {
  'merge-pdf': [
    {
      type: 'p',
      text: 'Use LocalDocu to combine multiple PDF files on your device. Select the files, reorder them in the list, choose Merge, run the operation, then save the result locally.',
    },
    { type: 'h2', text: 'How to merge PDFs' },
    {
      type: 'ol',
      items: [
        'Open the workspace and select or drop two or more PDF files.',
        'Reorder the list so pages appear in the order you want.',
        'Choose Merge and run the operation.',
        'Save or download the merged PDF on your device.',
      ],
    },
    { type: 'h2', text: 'Privacy and offline' },
    {
      type: 'ul',
      items: [
        'Document bytes are processed in your browser — not uploaded to LocalDocu for merging.',
        'After the app shell is cached, supported merge workflows can continue offline.',
        'Browser capabilities (folder picker, save dialogs) vary by browser and device.',
      ],
    },
    {
      type: 'note',
      text: 'This page explains the merge workflow. The actual tool lives on the homepage workspace — there is no separate merge app.',
    },
    {
      type: 'links',
      items: [
        { label: 'PDF tools overview', to: SITE_PATHS.pdfTools },
        { label: 'Privacy', to: SITE_PATHS.privacy },
        { label: 'Offline use', to: SITE_PATHS.offline },
      ],
    },
  ],
  'merge-docx': [
    {
      type: 'p',
      text: 'LocalDocu supports practical DOCX merge for suitable Word documents. Select same-type Word files, set the order, choose Merge, and run locally.',
    },
    { type: 'h2', text: 'Current behavior' },
    {
      type: 'ul',
      items: [
        'DOCX files can be merged in a practical, content-oriented way.',
        'Processing happens on your device in the browser.',
        'Output is saved or downloaded locally — no document upload to LocalDocu.',
      ],
    },
    { type: 'h2', text: 'Limitations' },
    {
      type: 'ul',
      items: [
        'Not every Word feature or complex layout is guaranteed to survive merge.',
        'Merge expects same-type documents (for example DOCX with DOCX).',
        'Very large or unusual documents may hit browser capacity limits.',
      ],
    },
    {
      type: 'links',
      items: [
        { label: 'Convert DOCX to PDF', to: SITE_PATHS.docxToPdf },
        { label: 'How it works', to: SITE_PATHS.howItWorks },
      ],
    },
  ],
  'pdf-tools': [
    {
      type: 'p',
      text: 'LocalDocu’s homepage workspace includes the PDF operations listed below. Each runs locally in your browser for suitable workloads.',
    },
    { type: 'h2', text: 'Supported PDF operations' },
    {
      type: 'ul',
      items: [
        'Merge — combine multiple PDFs in list order',
        'Split — separate pages into outputs',
        'Extract pages — keep selected pages',
        'Delete pages — remove selected pages',
        'Rotate pages — 90°, 180°, or 270°',
        'Reorder pages — rearrange page order',
        'Compress — reduce size with balanced or maximum modes',
      ],
    },
    {
      type: 'p',
      text: 'Open the workspace, select a PDF (or several for merge), choose the operation in the panel, then run and save locally.',
    },
    {
      type: 'links',
      items: [
        { label: 'Merge PDFs', to: SITE_PATHS.mergePdf },
        { label: 'Offline capability', to: SITE_PATHS.offline },
        { label: 'FAQ', to: SITE_PATHS.faq },
      ],
    },
  ],
  'docx-to-pdf': [
    {
      type: 'p',
      text: 'Convert DOC or DOCX files to a readable PDF generated on your device. Select a Word file in the workspace, choose Convert to PDF, run, and save locally.',
    },
    { type: 'h2', text: 'Honest limits' },
    {
      type: 'ul',
      items: [
        'Conversion is text-oriented and capacity-gated for browser workloads.',
        'Complex Word layouts may not be preserved exactly.',
        'Very large or heavily formatted documents may need a future desktop app.',
      ],
    },
    {
      type: 'note',
      text: 'LocalDocu does not claim full Word layout fidelity for browser conversion.',
    },
    {
      type: 'links',
      items: [
        { label: 'Merge Word documents', to: SITE_PATHS.mergeDocx },
        { label: 'Desktop roadmap', to: SITE_PATHS.desktop },
      ],
    },
  ],
  offline: [
    {
      type: 'p',
      text: 'After a production visit caches the application shell, LocalDocu can load without a network for supported local workflows.',
    },
    { type: 'h2', text: 'What works offline' },
    {
      type: 'ul',
      items: [
        'App shell (HTML, JS, CSS, icons) via the service worker',
        'Local PDF and Word operations that do not need the network',
        'Informational pages that are part of the cached client app',
      ],
    },
    { type: 'h2', text: 'What may vary' },
    {
      type: 'ul',
      items: [
        'First visit still needs a network to download and cache the app',
        'Folder access, save pickers, and other browser APIs differ by browser',
        'Updates to the app require a connection when a new version is published',
      ],
    },
    {
      type: 'p',
      text: 'Offline is a product capability, not an error. Trust indicators show offline status without treating it as failure.',
    },
    {
      type: 'links',
      items: [
        { label: 'Privacy model', to: SITE_PATHS.privacy },
        { label: 'Future desktop capacity', to: SITE_PATHS.desktop },
      ],
    },
  ],
  privacy: [
    { type: 'h2', text: 'What stays local' },
    {
      type: 'ul',
      items: [
        'Document contents you select',
        'Document processing and local previews',
        'Operation execution in the browser session',
      ],
    },
    { type: 'h2', text: 'What the current application does not do' },
    {
      type: 'ul',
      items: [
        'No document-upload backend for processing',
        'No cloud document-processing pipeline',
        'No account requirement',
        'Cloud processing: Off · LocalDocu AI: Off',
      ],
    },
    { type: 'h2', text: 'Data flow (current release)' },
    {
      type: 'ol',
      items: [
        'You select files on your device',
        'LocalDocu reads them in the browser',
        'A local document engine runs the operation',
        'Output is saved or downloaded on your device',
      ],
    },
    { type: 'h2', text: 'What may change later' },
    {
      type: 'ul',
      items: [
        'LocalDocu desktop app for heavier local workloads',
        'LocalDocu AI in the desktop app: open-weight on-device model that uses document metadata and user intent to drive LocalDocu document-management commands (document contents stay on device)',
        'Optional telemetry only if clearly disclosed — Phase 1 has no product analytics pipeline',
      ],
    },
    {
      type: 'note',
      text: 'We do not claim “100% private,” “completely secure,” or “zero data collection” as absolute guarantees. Claims match the current implementation.',
    },
    {
      type: 'links',
      items: [
        { label: 'How it works', to: SITE_PATHS.howItWorks },
        { label: 'LocalDocu AI (future)', to: SITE_PATHS.localAi },
      ],
    },
  ],
  'how-it-works': [
    {
      type: 'p',
      text: 'LocalDocu is a local-first workspace: you select documents on your device, choose an operation, and run it in the browser. Results are saved or downloaded locally.',
    },
    { type: 'h2', text: 'Steps' },
    {
      type: 'ol',
      items: HOW_IT_WORKS_STEPS.map((s) => `${s.name}. ${s.text}`),
    },
    { type: 'h2', text: WHY_LOCAL_MATTERS.title },
    { type: 'ul', items: [...WHY_LOCAL_MATTERS.points] },
    {
      type: 'p',
      text: 'Preferred framing: use the computing capacity you already have. Suitable document operations can run locally instead of requiring document uploads and remote processing. Local processing can reduce unnecessary data transfer and remote compute for workloads your device can handle — without claiming universal energy efficiency.',
    },
    {
      type: 'links',
      items: [
        { label: 'Privacy', to: SITE_PATHS.privacy },
        { label: 'FAQ', to: SITE_PATHS.faq },
      ],
    },
  ],
  'open-source': [
    {
      type: 'p',
      text: `${SITE.name} is developed in the open under the ${SITE.license} license. Source code, issues, and roadmap live on GitHub. Community contributions are welcome.`,
    },
    { type: 'h2', text: 'What “open” means here' },
    {
      type: 'ul',
      items: [
        `${SITE.license} license`,
        'Source available on GitHub',
        'Transparent roadmap and issue reporting',
        'Welcome help on accessibility, documentation, testing, and design',
      ],
    },
    {
      type: 'note',
      text: 'The project is community-driven and developed in the open. It is not described as “community-owned” unless governance formally supports that claim.',
    },
    {
      type: 'links',
      items: [
        { label: 'View the GitHub repository', href: GITHUB_URL },
        { label: 'Contribute', to: SITE_PATHS.contribute },
        { label: 'Roadmap', to: SITE_PATHS.roadmap },
      ],
    },
  ],
  contribute: [
    {
      type: 'p',
      text: 'Help build LocalDocu with code, tests, documentation, accessibility improvements, design, and carefully written issues.',
    },
    { type: 'h2', text: 'Contributor journey' },
    {
      type: 'ol',
      items: [
        'Read the README and privacy model so local-first constraints stay clear.',
        'Browse open issues or propose a focused improvement.',
        'Follow CONTRIBUTING guidance for setup, branches, and pull requests.',
        'Keep document processing local — do not introduce upload backends or auth unless the project explicitly asks for that work.',
      ],
    },
    {
      type: 'links',
      items: [
        { label: 'GitHub repository', href: GITHUB_URL },
        { label: 'Contributing guide', href: `${GITHUB_URL}/blob/main/CONTRIBUTING.md` },
        { label: 'Open source overview', to: SITE_PATHS.openSource },
        { label: 'Code of conduct', href: `${GITHUB_URL}/blob/main/CODE_OF_CONDUCT.md` },
        { label: 'Security policy', href: `${GITHUB_URL}/blob/main/SECURITY.md` },
      ],
    },
  ],
  roadmap: [
    {
      type: 'p',
      text: 'The web workspace is the product today: local PDF and Word tools in the browser. Later phases add a LocalDocu desktop app and LocalDocu AI for intent-driven workflows on device.',
    },
    { type: 'h2', text: 'Shipped (web)' },
    {
      type: 'ul',
      items: [
        'Select files / folder / drag-and-drop',
        'PDF merge, split, extract, delete, rotate, reorder, compress',
        'Practical DOCX merge and text-oriented DOC/DOCX → PDF',
        'Organize: sort, filter, rename, copy, move, folder, export',
        'PWA app shell, themes, privacy and network status',
      ],
    },
    { type: 'h2', text: 'Next directions' },
    {
      type: 'ul',
      items: [
        'Desktop app for heavier local workloads (positioning page available)',
        'LocalDocu AI (desktop): open-weight on-device model → metadata + intent → LocalDocu document-management commands (not active yet)',
        'Continued hardening of tests, accessibility, and discoverability',
      ],
    },
    {
      type: 'links',
      items: [
        { label: 'Desktop', to: SITE_PATHS.desktop },
        { label: 'LocalDocu AI', to: SITE_PATHS.localAi },
        { label: 'GitHub', href: GITHUB_URL },
      ],
    },
  ],
  desktop: [
    {
      type: 'p',
      text: 'A LocalDocu desktop application is planned for advanced local document automation — especially workloads that exceed comfortable browser limits — and as the home for LocalDocu AI. This page is positioning only; the desktop app is not shipping yet.',
    },
    { type: 'h2', text: 'Intended direction' },
    {
      type: 'ul',
      items: [
        'Stronger local resources for large or complex jobs',
        'Same local-first privacy principles as the web app',
        'LocalDocu AI: intent understanding that drives LocalDocu document-management capabilities using document metadata',
        'Windows-first targets under consideration in the product roadmap',
      ],
    },
    {
      type: 'note',
      text: 'Use the web workspace today. Do not expect desktop-only features or LocalDocu AI in the current browser release.',
    },
    {
      type: 'links',
      items: [
        { label: 'LocalDocu AI', to: SITE_PATHS.localAi },
        { label: 'Roadmap', to: SITE_PATHS.roadmap },
        { label: 'Open LocalDocu (web)', to: SITE_PATHS.home },
      ],
    },
  ],
  'local-ai': [
    {
      type: 'p',
      text: 'LocalDocu AI is a planned desktop capability: an open-weight, local-device-friendly model that understands user intent and LocalDocu’s document-management capabilities, then runs complex multi-step work through those local engines. LocalDocu AI is Off in the current web release.',
    },
    { type: 'h2', text: 'What LocalDocu AI is designed to do' },
    {
      type: 'ul',
      items: [
        'Run from the LocalDocu desktop application (not as a cloud AI document pipeline)',
        'Use document metadata and your request — not document contents — to plan work',
        'Drive LocalDocu’s existing document-management and PDF/Word operations for complex tasks',
        'Use an open-weight model suited to capable local devices, chosen to preserve quality and performance rather than trade them away',
      ],
    },
    { type: 'h2', text: 'Intended model (future)' },
    {
      type: 'ol',
      items: [
        'You describe what you want in plain language in the desktop app',
        'LocalDocu AI interprets intent using LocalDocu capability knowledge plus document metadata (names, types, counts, structure signals — not file contents)',
        'A validated command plan is produced against the LocalDocu command registry',
        'Deterministic local engines execute the plan on your device',
      ],
    },
    {
      type: 'note',
      text: 'This architecture is not implemented yet. The web workspace does not pretend LocalDocu AI is active. Document contents are not sent to a remote AI for processing in the current release.',
    },
    {
      type: 'links',
      items: [
        { label: 'Desktop', to: SITE_PATHS.desktop },
        { label: 'Privacy', to: SITE_PATHS.privacy },
        { label: 'Roadmap', to: SITE_PATHS.roadmap },
      ],
    },
  ],
  faq: [
    { type: 'p', text: FAQ_SUBTITLE },
    { type: 'faq' },
    {
      type: 'links',
      items: [
        { label: 'Privacy details', to: SITE_PATHS.privacy },
        { label: 'Contribute', to: SITE_PATHS.contribute },
      ],
    },
  ],
};

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
                  <Link
                    className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                    to={item.to!}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        );
      case 'faq':
        return (
          <div key={index} className="space-y-3">
            {FAQ_ITEMS.map((item) => (
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
      default:
        return null;
    }
  });
}
