import type { AnimationDef } from '../types';
import { airStream, easyPitchY, pitchStrip, pitchTrace, rings } from './parts';
import './dynamics.css';

/** The sound source: an open mouth, rings and air leaving it to the right. */
const mouth = { x: 50, y: 86 };
const ringX = 66;

/** The volume lane, and the count staircase that takes its place in step 2. */
const laneY = 172;
const laneLeft = 60;
const laneRight = 344;

const top = 216;
const bottom = 268;
const easy = easyPitchY(top, bottom);

export interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Ten bars standing on one baseline across the lane, each a little taller than the last, so the count
 * 1 to 10 reads as a staircase. `base` is the baseline; heights run from `low` to `high`.
 */
export function stairs(count: number, left: number, right: number, base: number, low: number, high: number, gap = 6): Bar[] {
  const width = (right - left - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, i) => {
    const height = Math.round((low + ((high - low) * i) / Math.max(count - 1, 1)) * 10) / 10;
    return { x: Math.round((left + i * (width + gap)) * 10) / 10, y: Math.round((base - height) * 10) / 10, width, height };
  });
}

/** Where step 2 sits in the loop, as percentages: the count climbs over the first half and comes back down over the second. */
export const countWindow: [number, number] = [50, 75];

/**
 * The [on, off) span of bar `n` (1 to 10) in loop percent. Counting up, bar n lights as “n” is said; counting
 * down from 10, it goes out as the count drops below n. The spans nest, so the lit bars always form a staircase.
 */
export function barSpan(n: number, count = 10, [from, to] = countWindow): [number, number] {
  const step = (to - from) / 2 / count;
  return [from + (n - 1) * step, to - (n - 1) * step];
}

const bars = stairs(10, laneLeft, laneRight, laneY + 10, 6, 28);
const rect = ({ x, y, width, height }: Bar, className: string) =>
  `<rect class="${className}" x="${x}" y="${y}" width="${width}" height="${height}" rx="2"/>`;
const first = bars[0]!;
const last = bars[bars.length - 1]!;

const flatPath = `M60 ${easy} L344 ${easy}`;

/** One small bump on the easy line per number said: ten up, ten down, all on the same pitch. */
function countPath(syllables: number): string {
  const w = (344 - 60) / syllables;
  let d = `M60 ${easy}`;
  for (let i = 0; i < syllables; i++) {
    const x = 60 + i * w;
    d += ` C ${(x + w * 0.2).toFixed(1)} ${easy - 6}, ${(x + w * 0.8).toFixed(1)} ${easy - 6}, ${(x + w).toFixed(1)} ${easy}`;
  }
  return d;
}

/** “Over here!” said twice, called then normal, with the same small lift on “here” both times. */
function phrasePath(): string {
  const half = (344 - 60) / 2;
  let d = `M60 ${easy}`;
  for (const x0 of [60, 60 + half]) {
    d +=
      ` C ${x0 + 10} ${easy - 5}, ${x0 + 22} ${easy - 5}, ${x0 + 32} ${easy}` +
      ` C ${x0 + 40} ${easy + 4}, ${x0 + 50} ${easy + 4}, ${x0 + 58} ${easy}` +
      ` C ${x0 + 72} ${easy - 12}, ${x0 + 92} ${easy - 12}, ${x0 + 108} ${easy + 2}` +
      ` L${x0 + half} ${easy + 2}`;
  }
  return d;
}

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <text class="anim-label" x="20" y="24">SPACE · open</text>
  <text class="anim-label dy-more" x="344" y="58" text-anchor="end">AIR · more</text>
  <text class="anim-label dy-less" x="344" y="58" text-anchor="end">AIR · less</text>

  <path class="dy-band" d="M${ringX} ${mouth.y} L 324 ${mouth.y}"/>
  ${airStream(`M${ringX} ${mouth.y} L 330 ${mouth.y}`, 'dy-air')}
  <g class="dy-swell" style="transform-origin:${ringX}px ${mouth.y}px">${rings(ringX, mouth.y, 32, 'dy-rings')}</g>
  <ellipse class="dy-mouth" cx="${mouth.x}" cy="${mouth.y}" rx="14" ry="22"/>

  <g class="dy-p1"><text class="anim-label" x="60" y="150">VOLUME · quiet, loud, quiet</text></g>
  <g class="dy-up"><text class="anim-label" x="60" y="150">VOLUME · louder</text></g>
  <g class="dy-down"><text class="anim-label" x="60" y="150">VOLUME · quieter</text></g>
  <g class="dy-call"><text class="anim-label" x="60" y="150">CALL</text></g>
  <g class="dy-normal"><text class="anim-label" x="60" y="150">NORMAL · same space</text></g>

  <g class="dy-lane">
    <rect class="lane-track" x="${laneLeft}" y="${laneY}" width="${laneRight - laneLeft}" height="10" rx="5"/>
    <rect class="dy-lane-fill" x="${laneLeft}" y="${laneY}" width="${laneRight - laneLeft}" height="10" rx="5"/>
  </g>
  <g class="dy-p2">
    ${bars.map((b) => rect(b, 'dy-bar')).join('')}
    ${bars.map((b, i) => rect(b, `dy-bar-lit dy-bar-${i + 1}`)).join('')}
    <text class="anim-label" x="${first.x + first.width / 2}" y="${first.y - 6}" text-anchor="middle">1</text>
    <text class="anim-label" x="${last.x + last.width / 2}" y="${last.y - 6}" text-anchor="middle">10</text>
  </g>

  ${pitchStrip({ top, bottom, trace: false, dot: false })}
  <g class="dy-p1">
    <text class="anim-label" x="60" y="206">VOICE · swell</text>
    <text class="anim-say" x="344" y="206" text-anchor="end">“ah”</text>
  </g>
  <g class="dy-p2"><text class="anim-label" x="60" y="206">VOICE · count</text></g>
  <text class="anim-say dy-up" x="344" y="206" text-anchor="end">“1 … 10”</text>
  <text class="anim-say dy-down" x="344" y="206" text-anchor="end">“10 … 1”</text>
  <g class="dy-p3"><text class="anim-label" x="60" y="206">VOICE · speak</text></g>
  <text class="anim-say dy-call dy-loud-say" x="344" y="206" text-anchor="end">“Over here!”</text>
  <text class="anim-say dy-normal" x="344" y="206" text-anchor="end">“Over here!”</text>
  ${pitchTrace(flatPath, 'dy-p1 dy-t-swell')}
  ${pitchTrace(countPath(20), 'dy-p2 dy-t-count')}
  ${pitchTrace(phrasePath(), 'dy-p3 dy-t-phrase')}
</svg>`;

export const dynamics: AnimationDef = {
  id: 'dynamics',
  cycleSec: 16,
  svg,
  phases: [
    { until: 0.5, caption: 'Hum or “ah” on an easy mid pitch. Swell from quiet to speaking-loud and back to quiet over about 8 seconds.' },
    { until: 0.75, caption: 'Count 1 to 10 getting steadily louder on breath alone, then 10 to 1 getting quieter. Twice.' },
    { until: 1, caption: 'Call a short phrase across the room on a fresh low breath, then say it at normal volume with the same open throat.' },
  ],
};
