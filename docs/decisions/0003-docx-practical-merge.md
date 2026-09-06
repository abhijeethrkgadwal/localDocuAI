# ADR 0003: Practical DOCX merge without Word fidelity claims

## Status

Accepted

## Context

Users need local DOCX merge and preview. Full Microsoft Word fidelity (styles, headers/footers, images, fields, tracked changes) is a large engineering surface. Claiming perfect compatibility without tests would violate LocalDoc AI’s honesty principles.

## Decision

- Ship a **practical body-append DOCX merge** (JSZip + `word/document.xml` body concatenation).
- Provide **plain-text preview** extracted from `document.xml`.
- Defer **DOCX → PDF** until a local conversion path is proven with fixtures.
- Document limitations in UI and ADR; never claim “Word-perfect” unless automated fixtures prove it.

## Fixtures covered in tests

- Paragraphs
- Headings
- Tables
- Page breaks
- Headers / footers (present in sources; not fully merged across files)

Images and complex styles are not guaranteed across merges yet.

## Consequences

- Merged DOCX files are useful for combining narrative content locally.
- Later files’ headers/footers/media may be incomplete in the merge result.
- Product copy must stay precise about what works.
