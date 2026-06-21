// Zero-width character steganography for invisible watermarking.
// ZW_ZERO / ZW_ONE encode binary; ZW_SEP delimits the payload.
const ZW_ZERO = '​'; // zero-width space         → bit 0
const ZW_ONE  = '‌'; // zero-width non-joiner    → bit 1
const ZW_SEP  = '‍'; // zero-width joiner        → delimiter

function toBinary(str: string): string {
  return str
    .split('')
    .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');
}

function fromBinary(bin: string): string {
  return (bin.match(/.{8}/g) ?? []).map(b => String.fromCharCode(parseInt(b, 2))).join('');
}

function encode(bin: string): string {
  return bin.split('').map(b => b === '0' ? ZW_ZERO : ZW_ONE).join('');
}

function decode(encoded: string): string {
  return encoded.split('').map(c => {
    if (c === ZW_ZERO) return '0';
    if (c === ZW_ONE)  return '1';
    return '';
  }).join('');
}

export function embedWatermark(text: string, watermarkId: string): string {
  const payload = ZW_SEP + encode(toBinary(watermarkId)) + ZW_SEP;
  // Insert after the first sentence-ending character, or at position 100.
  const dot = text.search(/[。！？.!?]/);
  const pos = dot >= 0 ? dot + 1 : Math.min(100, text.length);
  return text.slice(0, pos) + payload + text.slice(pos);
}

export function extractWatermark(text: string): string | null {
  const re = new RegExp(`${ZW_SEP}([${ZW_ZERO}${ZW_ONE}]+)${ZW_SEP}`);
  const match = text.match(re);
  if (!match?.[1]) return null;
  const bin = decode(match[1]);
  if (bin.length % 8 !== 0) return null;
  return fromBinary(bin);
}

export function stripWatermarks(text: string): string {
  return text.replace(/[​‌‍]/g, '');
}

export function buildCopyrightFooter(params: {
  authorName: string;
  projectTitle: string;
  proofId?: string;
  publishedAt?: Date;
}): string {
  const { authorName, projectTitle, proofId, publishedAt } = params;
  const year = (publishedAt ?? new Date()).getFullYear();
  let footer = `\n\n---\n© ${year} ${authorName}. All rights reserved.\n「${projectTitle}」`;
  if (proofId) footer += `\n著作権証明ID: ${proofId}`;
  footer +=
    '\nこの著作物は著作権証明サービスにより記録されています。無断転載・複製を禁じます。\n' +
    '（本サービスは著作権証明の補助ツールです。法的効力を保証するものではありません）';
  return footer;
}
