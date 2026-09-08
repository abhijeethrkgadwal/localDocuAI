/** Shared copy for visible FAQ + JSON-LD (keep answers identical for AEO/GEO). */

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const PRODUCT_SUMMARY =
  'LocalDocu is privacy-first, local-first document automation for PDF and Word files. You select files on your device; merge, split, extract, delete pages, rotate, reorder, compress, rename, and convert run in the browser. Document contents are not uploaded for processing in the current release.';

export const HOW_IT_WORKS_STEPS = [
  {
    name: 'Select files or a folder',
    text: 'Choose PDF, DOC, or DOCX files with the file picker, folder picker, or drag and drop. Files stay in your browser session.',
  },
  {
    name: 'Choose an operation',
    text: 'Merge, split, extract pages, delete pages, rotate, reorder, compress, convert Word to PDF, or manage files locally.',
  },
  {
    name: 'Run on your device',
    text: 'Processing happens locally in your browser. Save or download the result — nothing is sent to a LocalDocu server for document processing.',
  },
] as const;

export const WHY_LOCAL_MATTERS = {
  title: 'Why local processing can matter',
  points: [
    'Unnecessary file transfers can be avoided for suitable workloads.',
    'Suitable document operations can use the computing capacity you already have on your device.',
    'You can process documents without maintaining a remote processing session.',
    'A future desktop app can provide more resources for larger workloads and host LocalDocu AI.',
  ],
} as const;

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-localdocu',
    question: 'What is LocalDocu?',
    answer:
      'LocalDocu is an open-source, local-first document workspace for working with PDFs and Word documents. Supported document operations run locally in your browser rather than requiring document upload to a LocalDocu server.',
  },
  {
    id: 'are-files-uploaded',
    question: 'Does LocalDocu upload my documents?',
    answer:
      'Document processing in the current release is local. Your selected document bytes are processed on your device and are not uploaded to LocalDocu for document processing.',
  },
  {
    id: 'works-offline',
    question: 'Can I use LocalDocu offline?',
    answer:
      'Yes, for supported local workflows once the application has been loaded and cached by the browser. Availability of individual browser capabilities can vary by browser and device.',
  },
  {
    id: 'supported-formats',
    question: 'What file formats does LocalDocu support?',
    answer:
      'LocalDocu supports PDF for merge, split, extract, delete pages, rotate, reorder, and compress. It also supports practical DOCX merge, text preview, and capacity-gated DOC/DOCX to PDF conversion (text-oriented PDF). Complex Word layouts may not be preserved exactly.',
  },
  {
    id: 'account-required',
    question: 'Do I need an account?',
    answer: 'No account is required for the current application.',
  },
  {
    id: 'how-to-merge-pdfs',
    question: 'How do I merge PDFs privately?',
    answer:
      'Open LocalDocu, select or drop two or more PDF files, arrange the order in the list, choose Merge, run the operation, then save or download the result locally. Files are not uploaded for merging.',
  },
  {
    id: 'files-after-finish',
    question: 'What happens to my files after I finish?',
    answer:
      'Document bytes stay in your browser session and local file handles for the work you are doing. LocalDocu does not keep a cloud copy of your documents. Closing the tab or clearing site data ends the in-memory session; files you saved or downloaded remain where you stored them on your device.',
  },
  {
    id: 'reduce-cloud-processing',
    question: 'Can LocalDocu reduce unnecessary cloud processing?',
    answer:
      'For suitable document workflows, LocalDocu lets your own device perform processing instead of sending document data to a remote document-processing service. This can reduce unnecessary data transfer and some server-side processing for those workloads. It does not claim universal energy savings versus every cloud setup.',
  },
  {
    id: 'is-open-source',
    question: 'Is LocalDocu open source?',
    answer:
      'Yes. The project is developed in the open under the Apache-2.0 license. Source code, contribution guidance, and roadmap are available through GitHub.',
  },
  {
    id: 'how-to-contribute',
    question: 'How can I contribute?',
    answer:
      'You can help with code, tests, documentation, accessibility, design, and issue reports. See the Contribute page for the contributor journey and link to the GitHub repository.',
  },
  {
    id: 'heavy-operations',
    question: 'What happens when a browser cannot perform a heavy operation?',
    answer:
      'Some advanced or resource-intensive capabilities may exceed what a given browser or device can handle comfortably. Those workloads may be better suited to a future desktop application with stronger local resources. The web app remains focused on suitable browser workloads.',
  },
  {
    id: 'what-is-localdocu-ai',
    question: 'What is LocalDocu AI?',
    answer:
      'LocalDocu AI is a planned capability for the LocalDocu desktop app. It uses an open-weight, local-device-friendly model to understand your intent and LocalDocu’s document-management capabilities, then runs complex tasks through those local engines. It is designed to work from document metadata and your request — not by sending document contents to the cloud. LocalDocu AI is Off in the current web release.',
  },
];

export const FAQ_SUBTITLE =
  'Common questions about LocalDocu, privacy, supported files, offline use, and LocalDocu AI.';
