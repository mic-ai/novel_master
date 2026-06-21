// Winnowing algorithm for near-duplicate detection.
// Reference: Schleimer et al., "Winnowing: Local Algorithms for Document Fingerprinting" (SIGMOD 2003)

export const SIMILARITY_THRESHOLDS = {
  CLEAN:    0.15,
  WARNING:  0.40,
  FLAGGED:  0.70,
} as const;

export type SimilarityStatus = 'CLEAN' | 'WARNING' | 'FLAGGED' | 'CRITICAL';

export function getSimilarityStatus(similarity: number): SimilarityStatus {
  if (similarity <= SIMILARITY_THRESHOLDS.CLEAN)   return 'CLEAN';
  if (similarity <= SIMILARITY_THRESHOLDS.WARNING)  return 'WARNING';
  if (similarity <= SIMILARITY_THRESHOLDS.FLAGGED)  return 'FLAGGED';
  return 'CRITICAL';
}

function normalize(text: string): string {
  // Keep ASCII alphanumeric, hiragana (U+3040-U+30FF), CJK ideographs (U+4E00-U+9FFF)
  return text.toLowerCase().replace(/[^\w぀-ヿ一-鿿]/g, '');
}

function hashKgram(kgram: string): number {
  let h = 0;
  for (let i = 0; i < kgram.length; i++) {
    h = (Math.imul(31, h) + kgram.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function generateFingerprints(
  text: string,
  kgramSize = 5,
  windowSize = 10,
): number[] {
  const norm = normalize(text);
  if (norm.length < kgramSize) return [];

  const hashes: number[] = [];
  for (let i = 0; i <= norm.length - kgramSize; i++) {
    hashes.push(hashKgram(norm.slice(i, i + kgramSize)));
  }

  const fingerprints = new Set<number>();
  for (let i = 0; i <= hashes.length - windowSize; i++) {
    fingerprints.add(Math.min(...hashes.slice(i, i + windowSize)));
  }

  if (fingerprints.size === 0) fingerprints.add(Math.min(...hashes));

  return Array.from(fingerprints);
}

export function calculateJaccardSimilarity(fp1: number[], fp2: number[]): number {
  if (fp1.length === 0 || fp2.length === 0) return 0;
  const s1 = new Set(fp1);
  const s2 = new Set(fp2);
  let intersection = 0;
  for (const h of s1) if (s2.has(h)) intersection++;
  const union = s1.size + s2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
