export const WAVE_HEIGHT = 48;
const BAR_WIDTH = 2;
const BAR_GAP = 1;
const MIN_BAR = 2;
const FLAT_BAR = 6;

/** The peaks file `scripts/audio-peaks.mjs` writes next to a track. */
export function peaksUrl(audioSrc: string): string {
  return audioSrc.replace(/\.[^./]+$/, '') + '.peaks.json';
}

/** The peaks from a parsed peaks file, or null when the data is not a usable list of loudness values. */
export function parsePeaks(data: unknown): number[] | null {
  const peaks = (data as { peaks?: unknown } | null)?.peaks;
  if (!Array.isArray(peaks) || peaks.length === 0) return null;
  if (!peaks.every((p) => typeof p === 'number' && Number.isFinite(p))) return null;
  return peaks.map((p: number) => Math.min(1, Math.max(0, p)));
}

/** Resamples the peaks to `count` bars, each the loudest value in its slice. */
export function foldPeaks(peaks: readonly number[], count: number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const from = Math.floor((i * peaks.length) / count);
    const to = Math.max(from + 1, Math.floor(((i + 1) * peaks.length) / count));
    bars.push(Math.max(...peaks.slice(from, to)));
  }
  return bars;
}

/** SVG shapes for a waveform `width` px wide, mirrored about the centre line; a flat bar without peaks. */
export function waveformShapes(peaks: readonly number[] | null, width: number): string {
  const mid = WAVE_HEIGHT / 2;
  if (!peaks) return `<rect x="0" y="${mid - FLAT_BAR / 2}" width="${width}" height="${FLAT_BAR}" rx="${FLAT_BAR / 2}"/>`;
  const pitch = BAR_WIDTH + BAR_GAP;
  const count = Math.max(1, Math.floor((width + BAR_GAP) / pitch));
  const left = (width - (count * pitch - BAR_GAP)) / 2;
  return foldPeaks(peaks, count)
    .map((peak, i) => {
      const height = Math.max(MIN_BAR, Math.round(peak * WAVE_HEIGHT));
      return `<rect x="${round(left + i * pitch)}" y="${round(mid - height / 2)}" width="${BAR_WIDTH}" height="${height}" rx="1"/>`;
    })
    .join('');
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
