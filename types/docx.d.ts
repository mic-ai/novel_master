// docx パッケージの最小スタブ宣言（npm install docx 後に本物の型が使われる）
declare module 'docx' {
  export const HeadingLevel: Record<string, string>;
  export const AlignmentType: Record<string, string>;
  export class Document {
    constructor(opts: { sections: { children: unknown[] }[] });
  }
  export class Paragraph {
    constructor(opts: Record<string, unknown>);
  }
  export class TextRun {
    constructor(opts: Record<string, unknown>);
  }
  export const Packer: {
    toBuffer(doc: Document): Promise<Buffer>;
  };
}
