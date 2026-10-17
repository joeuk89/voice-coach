import { esc } from '../lib/dom';
import { paragraphs } from '../paragraphs';
import type { AnimationDef } from '../types';
import './read-aloud.css';

const base = 176;
const textY = 226;
const left = 36;
const right = 326;
const fontSize = 18;
const minFontSize = 13;
/** Pass 1 rise over each bold word in turn, falling a little across the line as speech does. */
const peakHeights = [96, 84, 74];
const maxHalfWidth = 48;

/** Advance widths in em of system-ui (SF Pro Text) at 18 px, weight 400; any other character counts as 0.6. */
const emGroups: [string, number][] = [
  [' ,.:;!’\'ijlI|', 0.25],
  ['frt()', 0.34],
  ['-', 0.45],
  ['acekvsxyz?J', 0.52],
  ['bdghnopqu', 0.57],
  ['EFLPST', 0.58],
  ['ABKRVXYZ', 0.64],
  ['CDGHNOQU', 0.72],
  ['mw', 0.8],
  ['MW', 0.9],
];
const boldFactor = 1.06;

function emWidth(text: string, bold: boolean): number {
  let sum = 0;
  for (const ch of text) sum += emGroups.find(([chars]) => chars.includes(ch))?.[1] ?? 0.6;
  return bold ? sum * boldFactor : sum;
}

const round = (n: number) => Math.round(n * 10) / 10;

export interface DemoRun {
  text: string;
  hot: boolean;
  /** Centre of the run; each run is drawn centred on it, so a peak at this x sits exactly over a bold word. */
  x: number;
}

export interface DemoLayout {
  size: number;
  width: number;
  runs: DemoRun[];
  peaks: number[];
}

/**
 * Lays a demo line out on one line between the axis ends, centred, from estimated glyph widths.
 * Each *bold* word and each plain stretch becomes its own run, so estimation error only shows in
 * the gaps between runs, never in where a peak sits over its word. Long lines shrink to fit.
 */
export function layoutDemo(line: string): DemoLayout {
  const parts = line
    .split('*')
    .map((text, i) => ({ text, hot: i % 2 === 1 }))
    .filter((p) => p.text);
  const em = parts.reduce((sum, p) => sum + emWidth(p.text, p.hot), 0);
  const fitted = Math.floor(((right - left) / em) * 2) / 2;
  const size = Math.max(minFontSize, Math.min(fontSize, fitted));
  const width = em * size;

  let cursor = left + (right - left - width) / 2;
  const runs: DemoRun[] = [];
  for (const { text, hot } of parts) {
    const visible = text.trim();
    const lead = emWidth(text.slice(0, text.length - text.trimStart().length), hot) * size;
    if (visible) runs.push({ text: visible, hot, x: round(cursor + lead + (emWidth(visible, hot) * size) / 2) });
    cursor += emWidth(text, hot) * size;
  }
  return { size, width: round(width), runs, peaks: runs.filter((r) => r.hot).map((r) => r.x) };
}

/**
 * Rests on the baseline and rises to a rounded peak over each bold word. Each rise spans at most
 * `maxHalfWidth` either side of its word, and never past halfway to the next. `scale` shrinks every rise for pass 2.
 */
export function contour(peaks: number[], scale: number): string {
  const path = [`M${left} ${base}`];
  peaks.forEach((x, i) => {
    const before = i > 0 ? (x - peaks[i - 1]!) / 2 : x - left;
    const after = i < peaks.length - 1 ? (peaks[i + 1]! - x) / 2 : right - x;
    const half = Math.min(maxHalfWidth, before, after);
    const top = round(base - peakHeights[i % peakHeights.length]! * scale);
    const [from, to, inner, outer] = [round(x - half), round(x + half), round(x - half / 2), round(x + half / 2)];
    path.push(`L ${from} ${base}`, `C ${inner} ${base}, ${inner} ${top}, ${x} ${top}`, `C ${outer} ${top}, ${outer} ${base}, ${to} ${base}`);
  });
  path.push(`L ${right} ${base}`);
  return path.join(' ');
}

/** The card for a passage's demo line; without one it shows the first passage's. */
function svgFor(demo = paragraphs[0]?.demo ?? ''): string {
  const { size, runs, peaks } = layoutDemo(demo);
  const bigContour = contour(peaks, 1);
  const softContour = contour(peaks, 0.7);
  const words = runs
    .map((r) => `<text class="ra-text${r.hot ? ' hot' : ''}" x="${r.x}" y="${textY}">${esc(r.text)}</text>`)
    .join('');

  return `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <line class="pitch-axis" x1="${left}" y1="${base}" x2="${right}" y2="${base}"/>
  <g class="ra-pass ra-pass-1">
    <text class="anim-label" x="36" y="36">PASS 1 · OVER THE TOP</text>
    <path class="ra-line ra-line-1" pathLength="1" d="${bigContour}"/>
    <circle class="pitch-dot ra-dot ra-dot-1" r="6" style="offset-path: path('${bigContour}')"/>
  </g>
  <g class="ra-pass ra-pass-2">
    <text class="anim-label" x="36" y="36">PASS 2 · 70 PERCENT</text>
    <path class="ra-ghost" d="${bigContour}"/>
    <path class="ra-line ra-line-2" pathLength="1" d="${softContour}"/>
    <circle class="pitch-dot ra-dot ra-dot-2" r="6" style="offset-path: path('${softContour}')"/>
  </g>

  <g class="ra-words" text-anchor="middle" style="font-size: ${size}px">${words}</g>
</svg>`;
}

export const readAloud: AnimationDef = {
  id: 'read-aloud',
  cycleSec: 10,
  svg: svgFor,
  compactViewBox: '0 16 360 226',
  phases: [
    { until: 0.5, caption: 'Read it once completely over the top. Exaggerate every rise and fall.' },
    { until: 1, caption: 'Read it again at 70 percent. Keep the movement, lose the parody.' },
  ],
};
