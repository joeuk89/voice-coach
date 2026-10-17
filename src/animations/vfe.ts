import type { AnimationDef } from '../types';
import { pitchStrip } from './parts';
import './vfe.css';

/** One subpath per step. The dot rides the combined path; each step's trace is its own element. */
export const vfeSegments = [
  'M40 170 L150 170',
  'M158 230 C 170 230, 178 110, 198 110',
  'M206 110 C 226 110, 234 230, 254 230',
  'M262 230 L272 230 L272 215 L284 215 L284 200 L296 200 L296 185 L308 185 L308 170 L320 170',
];
export const vfePath = vfeSegments.join(' ');

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <g class="vf-steps">
    <text class="anim-label" x="20" y="30">1 WARM UP</text>
    <text class="anim-label" x="100" y="30">2 STRETCH</text>
    <text class="anim-label" x="184" y="30">3 CONTRACT</text>
    <text class="anim-label" x="280" y="30">4 ADDUCT</text>
  </g>

  <g class="vf-watch">
    <circle class="body" cx="320" cy="72" r="18"/>
    <rect class="vf-nub" x="317" y="48" width="6" height="6" rx="1"/>
    <line class="vf-hand" x1="320" y1="72" x2="320" y2="58"/>
    <text class="anim-label" x="320" y="108" text-anchor="middle">time it</text>
  </g>

  ${pitchStrip({ top: 110, bottom: 230, left: 40, path: vfePath, className: 'vf-pitch', trace: false })}
  ${vfeSegments.map((d, i) => `<path class="pitch-line vf-seg vf-seg-${i + 1}" pathLength="1" d="${d}"/>`).join('')}
  <text class="anim-label" x="48" y="162">“ee” as long as you can</text>
  <text class="anim-label" x="262" y="252">“ol” × 5 pitches</text>
</svg>`;

export const vfe: AnimationDef = {
  id: 'vfe',
  cycleSec: 16,
  svg,
  phases: [
    { until: 0.25, caption: '1 Warm up: soft, nasal “ee” on a comfortable mid pitch, as long as you can. Time it.' },
    { until: 0.45, caption: '2 Stretch: glide low to high on “knoll”, slow and smooth.' },
    { until: 0.65, caption: '3 Contract: glide high to low on “knoll”.' },
    { until: 1, caption: '4 Adduction: sustain “ol” softly on five rising pitches. Time each one.' },
  ],
};
