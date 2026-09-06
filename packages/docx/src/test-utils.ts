import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  Header,
  Footer,
} from 'docx';

/** Build fixture DOCX bytes covering common structural elements. */
export async function createTestDocx(
  label: string,
  options: { withTable?: boolean; withPageBreak?: boolean } = {},
): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: label,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Basic paragraph for ', size: 24 }),
        new TextRun({ text: label, bold: true, size: 24 }),
        new TextRun({ text: '.', size: 24 }),
      ],
    }),
  ];

  if (options.withTable) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('A')] }),
              new TableCell({ children: [new Paragraph('B')] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('1')] }),
              new TableCell({ children: [new Paragraph('2')] }),
            ],
          }),
        ],
      }),
    );
  }

  if (options.withPageBreak) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({ text: `${label} — page 2` }));
  }

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [new Paragraph({ text: `Header — ${label}`, alignment: AlignmentType.RIGHT })],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({ text: `Footer — ${label}`, alignment: AlignmentType.CENTER }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Uint8Array.from(buffer);
}

export async function createTestDocxs(
  count: number,
  prefix = 'doc',
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const files: { name: string; bytes: Uint8Array }[] = [];
  for (let i = 1; i <= count; i++) {
    const name = `${prefix}${i}.docx`;
    files.push({
      name,
      bytes: await createTestDocx(name, { withTable: i === 1, withPageBreak: i === 2 }),
    });
  }
  return files;
}
