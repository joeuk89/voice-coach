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

const cycleSec = 16;
/** Each pass owns a quarter of the loop. Its line travels for the first 23 points of it, then rests until the cut. */
const passPct = 25;
const travelPct = 23;
/** The pause pass holds the dot this long before each bold word. */
const beatPct = (0.5 / cycleSec) * 100;
/** Width of the break in the pause pass line, ending at the bold word's left edge. */
const gapWidth = 22;
/** The pause mark sits this far before the bold word, clear of the waiting dot's halo. */
const markInset = 7;
/** The pace pass keeps the pitch small so the speed is what moves. */
const paceScale = 0.4;
/** The quick half moves this many times faster than the slow half. */
const quickFactor = 3;
/** Baseline of the SLOW and QUICK labels, clear above the pace pass's small rises. */
const paceLabelY = 112;

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
  /** Estimated width of the run, for placing things beside it rather than over it. */
  width: number;
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
    const runWidth = emWidth(visible, hot) * size;
    if (visible) runs.push({ text: visible, hot, x: round(cursor + lead + runWidth / 2), width: round(runWidth) });
    cursor += emWidth(text, hot) * size;
  }
  return { size, width: round(width), runs, peaks: runs.filter((r) => r.hot).map((r) => r.x) };
}

interface Bump {
  /** Where the rise leaves the baseline and where it lands back on it. */
  from: number;
  to: number;
  /** The peak: over the bold word's centre, at height `top`. */
  x: number;
  top: number;
  /** Control-point x either side, half way in, which rounds the shoulders. */
  inner: number;
  outer: number;
}

function bumps(peaks: number[], scale: number): Bump[] {
  return peaks.map((x, i) => {
    const before = i > 0 ? (x - peaks[i - 1]!) / 2 : x - left;
    const after = i < peaks.length - 1 ? (peaks[i + 1]! - x) / 2 : right - x;
    const half = Math.min(maxHalfWidth, before, after);
    const top = round(base - peakHeights[i % peakHeights.length]! * scale);
    return { from: round(x - half), to: round(x + half), x, top, inner: round(x - half / 2), outer: round(x + half / 2) };
  });
}

/**
 * The rises whose peaks lie between `from` and `to`. A rise never crosses the midpoint between two
 * peaks, so a span cut there holds whole rises.
 */
function bumpsBetween(peaks: number[], scale: number, from: number, to: number): Bump[] {
  return bumps(peaks, scale).filter((b) => b.x > from && b.x < to);
}

/**
 * Rests on the baseline and rises to a rounded peak over each bold word. Each rise spans at most
 * `maxHalfWidth` either side of its word, and never past halfway to the next. `scale` shrinks every
 * rise for pass 2. `from` and `to` draw only part of the line, cut on the baseline between two peaks.
 */
export function contour(peaks: number[], scale: number, from = left, to = right): string {
  const path = [`M${from} ${base}`];
  for (const b of bumpsBetween(peaks, scale, from, to)) {
    path.push(
      `L ${b.from} ${base}`,
      `C ${b.inner} ${base}, ${b.inner} ${b.top}, ${b.x} ${b.top}`,
      `C ${b.outer} ${b.top}, ${b.outer} ${base}, ${b.to} ${base}`,
    );
  }
  path.push(`L ${to} ${base}`);
  return path.join(' ');
}

type Point = [number, number];

function cubicLength(p0: Point, p1: Point, p2: Point, p3: Point, steps = 64): number {
  let length = 0;
  let prev = p0;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const at = (k: 0 | 1) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k];
    const next: Point = [at(0), at(1)];
    length += Math.hypot(next[0] - prev[0], next[1] - prev[1]);
    prev = next;
  }
  return length;
}

/** Drawn length of `contour(peaks, scale, from, to)`, so the dot can be placed by distance along it. */
export function contourLength(peaks: number[], scale: number, from = left, to = right): number {
  // Both halves of a rise are mirror images, so each rise is twice its first half plus the baseline either side.
  return bumpsBetween(peaks, scale, from, to).reduce(
    (sum, b) => sum - (b.to - b.from) + 2 * cubicLength([b.from, base], [b.inner, base], [b.inner, b.top], [b.x, b.top]),
    to - from,
  );
}

/**
 * Where the pace pass turns from slow to quick: the midpoint between two peaks nearest the middle of
 * the axis, which is always on the baseline.
 */
export function paceSplit(peaks: number[]): number {
  const middle = (left + right) / 2;
  const cuts = peaks.slice(1).map((x, i) => round((peaks[i]! + x) / 2));
  return cuts.reduce((best, x) => (Math.abs(x - middle) < Math.abs(best - middle) ? x : best), cuts[0] ?? middle);
}

export interface Gap {
  /** The dot holds here, where the line breaks off. */
  from: number;
  /** The line picks up again at the bold word's left edge. */
  to: number;
  /** x of the small pause mark drawn in the gap. */
  mark: number;
}

/** One break in the pause pass line before each bold word, ending at its left edge. */
export function pauseGaps(runs: DemoRun[]): Gap[] {
  return runs
    .filter((r) => r.hot)
    .map((r) => {
      const to = Math.max(left, round(r.x - r.width / 2));
      const from = Math.max(left, round(to - gapWidth));
      return { from, to, mark: Math.max(from, round(to - markInset)) };
    });
}

/** The stretches of the pause pass line between its gaps, as [from, to] in x. */
export function pausePieces(gaps: Gap[]): [number, number][] {
  const pieces: [number, number][] = [];
  let cursor = left;
  for (const gap of gaps) {
    if (gap.from > cursor) pieces.push([cursor, gap.from]);
    cursor = Math.max(cursor, gap.to);
  }
  if (right > cursor) pieces.push([cursor, right]);
  return pieces;
}

/** A point in a pass: at `at` percent of the loop the dot is `distance` (0 to 1) along its line. */
export type Stop = [at: number, distance: number];

const pct = (n: number) => Math.round(n * 100) / 100;

/**
 * The pause pass: the dot runs along a flat line at one speed and stands still for a beat at the
 * start of each gap, so every bold word is preceded by silence.
 */
export function pauseStops(gaps: Gap[]): Stop[] {
  const start = 2 * passPct;
  const perUnit = (travelPct - gaps.length * beatPct) / (right - left);
  const along = (x: number) => (x - left) / (right - left);
  const stops: Stop[] = [[start, 0]];
  let at = start;
  let x = left;
  for (const gap of gaps) {
    const hold = Math.max(x, gap.from);
    at += (hold - x) * perUnit;
    x = hold;
    stops.push([pct(at), along(x)]);
    at += beatPct;
    stops.push([pct(at), along(x)]);
  }
  stops.push([start + travelPct, 1]);
  return stops.filter(([a, d], i) => i === 0 || a !== stops[i - 1]![0] || d !== stops[i - 1]![1]);
}

/** The pace pass: slow up to the split, `quickFactor` times faster after it, both judged by drawn length. */
export function paceStops(slowLength: number, quickLength: number): Stop[] {
  const start = 3 * passPct;
  const slowTime = slowLength;
  const quickTime = quickLength / quickFactor;
  const turn = pct(start + (travelPct * slowTime) / (slowTime + quickTime));
  return [
    [start, 0],
    [turn, slowLength / (slowLength + quickLength)],
    [start + travelPct, 1],
  ];
}

/** The first moment the dot reaches `distance`, for revealing a stretch of line as the dot draws it. */
export function timeAt(stops: Stop[], distance: number): number {
  for (let i = 1; i < stops.length; i++) {
    const [a0, d0] = stops[i - 1]!;
    const [a1, d1] = stops[i]!;
    if (distance <= d0) return a0;
    if (distance <= d1) return pct(a0 + ((a1 - a0) * (distance - d0)) / (d1 - d0));
  }
  return stops[stops.length - 1]?.[0] ?? 0;
}

const percent = (d: number) => `${pct(d * 100)}%`;

/**
 * Keyframes that move a dot along its offset path through the stops, resting at each end outside
 * them. Stops at the same distance share one rule, so each held beat reads as a pair of times.
 */
export function glideKeyframes(name: string, stops: Stop[]): string {
  const first = stops[0] ?? [0, 0];
  const last = stops[stops.length - 1] ?? first;
  const frames: { times: string[]; distance: number }[] = [];
  for (const [at, d] of [[0, first[1]], ...stops, [100, last[1]]] as Stop[]) {
    const prev = frames[frames.length - 1];
    if (prev?.distance === d) prev.times.push(`${at}%`);
    else frames.push({ times: [`${at}%`], distance: d });
  }
  const rules = frames.map((f) => `${[...new Set(f.times)].join(', ')} { offset-distance: ${percent(f.distance)}; }`);
  return `@keyframes ${name} { ${rules.join(' ')} }`;
}

/** Keyframes that draw a line (pathLength 1) while the dot passes from `fromDistance` to `toDistance`. */
export function trailKeyframes(name: string, stops: Stop[], fromDistance: number, toDistance: number): string {
  const from = timeAt(stops, fromDistance);
  const to = timeAt(stops, toDistance);
  return `@keyframes ${name} { 0%, ${from}% { stroke-dashoffset: 1; } ${to}%, 100% { stroke-dashoffset: 0; } }`;
}

/** A short stable tag for a demo line, so cards with different lines get their own keyframe names. */
function tag(text: string): string {
  let h = 5381;
  for (const ch of text) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}

/** The card for a passage's demo line; without one it shows the first passage's. */
function svgFor(demo = paragraphs[0]?.demo ?? ''): string {
  const { size, runs, peaks } = layoutDemo(demo);
  const bigContour = contour(peaks, 1);
  const softContour = contour(peaks, 0.7);
  const words = runs
    .map((r) => `<text class="ra-text${r.hot ? ' hot' : ''}" x="${r.x}" y="${textY}">${esc(r.text)}</text>`)
    .join('');
  const id = tag(demo);

  // Pass 3: a flat line broken before each bold word, one piece per stretch of speech.
  const flat = `M${left} ${base} L ${right} ${base}`;
  const gaps = pauseGaps(runs);
  const pause = pauseStops(gaps);
  const along = (x: number) => (x - left) / (right - left);
  const pieces = pausePieces(gaps).map(([from, to], i) => ({ from, to, name: `ra-pause-${i}-${id}` }));

  // Pass 4: a small contour cut in two at the turn from slow to quick.
  const split = paceSplit(peaks);
  const paceContour = contour(peaks, paceScale);
  const slowLength = contourLength(peaks, paceScale, left, split);
  const quickLength = contourLength(peaks, paceScale, split, right);
  const pace = paceStops(slowLength, quickLength);
  const turn = pace[1]?.[1] ?? 0.5;

  const keyframes = [
    glideKeyframes(`ra-glide-3-${id}`, pause),
    ...pieces.map((p) => trailKeyframes(p.name, pause, along(p.from), along(p.to))),
    glideKeyframes(`ra-glide-4-${id}`, pace),
    trailKeyframes(`ra-slow-${id}`, pace, 0, turn),
    trailKeyframes(`ra-quick-${id}`, pace, turn, 1),
  ];

  return `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <style>${keyframes.join('\n')}</style>
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
  <g class="ra-pass ra-pass-3">
    <text class="anim-label" x="36" y="36">PASS 3 · PAUSE</text>
    ${gaps.map((g) => `<line class="ra-tick" x1="${g.mark}" y1="${base - 11}" x2="${g.mark}" y2="${base + 11}"/>`).join('')}
    ${pieces
      .map((p) => `<path class="ra-line" pathLength="1" d="M${p.from} ${base} L ${p.to} ${base}" style="animation-name: ${p.name}"/>`)
      .join('')}
    <circle class="pitch-dot ra-dot" r="6" style="offset-path: path('${flat}'); animation-name: ra-glide-3-${id}"/>
  </g>
  <g class="ra-pass ra-pass-4">
    <text class="anim-label" x="36" y="36">PASS 4 · PACE</text>
    <text class="anim-label" x="${round((left + split) / 2)}" y="${paceLabelY}" text-anchor="middle">SLOW</text>
    <text class="anim-label" x="${round((split + right) / 2)}" y="${paceLabelY}" text-anchor="middle">QUICK</text>
    <path class="ra-line" pathLength="1" d="${contour(peaks, paceScale, left, split)}" style="animation-name: ra-slow-${id}"/>
    <path class="ra-line" pathLength="1" d="${contour(peaks, paceScale, split, right)}" style="animation-name: ra-quick-${id}"/>
    <circle class="pitch-dot ra-dot" r="6" style="offset-path: path('${paceContour}'); animation-name: ra-glide-4-${id}"/>
  </g>

  <g class="ra-words" text-anchor="middle" style="font-size: ${size}px">${words}</g>
</svg>`;
}

export const readAloud: AnimationDef = {
  id: 'read-aloud',
  cycleSec,
  svg: svgFor,
  compactViewBox: '0 16 360 226',
  phases: [
    { until: 0.25, caption: 'Read it once completely over the top. Exaggerate every rise and fall.' },
    { until: 0.5, caption: 'Read it again at 70 percent. Keep the movement, lose the parody.' },
    { until: 0.75, caption: 'Pause pass: a deliberate beat of silence before every bold word. The silence is the emphasis.' },
    { until: 1, caption: 'Pace pass: one clause slow and weighty, the next quick and light. Exaggerate first, then dial back.' },
  ],
};
