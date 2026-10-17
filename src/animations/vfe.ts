import type { AnimationDef } from '../types';
import { pitchStrip } from './parts';
import './vfe.css';

/** One path per step, each with its own trace and dot. */
const vfeSegments = [
  'M40 170 L150 170',
  'M158 230 C 170 230, 178 110, 198 110',
  'M206 110 C 226 110, 234 230, 254 230',
  'M262 230 L272 230 L272 215 L284 215 L284 200 L296 200 L296 185 L308 185 L308 170 L320 170',
];

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <g class="vf-steps">
    <text class="anim-label" x="20" y="30">1 WARM UP</text>
    <text class="anim-label" x="100" y="30">2 STRETCH</text>
    <text class="anim-label" x="184" y="30">3 CONTRACT</text>
    <text class="anim-label" x="340" y="30" text-anchor="end">4 ADDUCT</text>
  </g>

  <g class="vf-watch">
    <circle class="body" cx="320" cy="72" r="18"/>
    <rect class="vf-nub" x="317" y="48" width="6" height="6" rx="1"/>
    <line class="vf-hand" x1="320" y1="72" x2="320" y2="58"/>
    <text class="anim-label" x="320" y="108" text-anchor="middle">time it</text>
  </g>

  ${pitchStrip({ top: 110, bottom: 230, left: 40, path: '', className: 'vf-pitch', trace: false, dot: false })}
  ${vfeSegments
    .map(
      (d, i) => `<path class="pitch-line vf-seg vf-seg-${i + 1}" pathLength="1" d="${d}"/>
  <g class="vf-show vf-show-${i + 1}"><circle class="pitch-dot vf-dot vf-dot-${i + 1}" r="6" style="offset-path: path('${d}')"/></g>`,
    )
    .join('')}
  <text class="anim-label" x="48" y="148">“ee” as long</text>
  <text class="anim-label" x="48" y="162">as you can</text>
  <text class="anim-label" x="340" y="252" text-anchor="end">“ol” × 5 pitches</text>
</svg>`;

export const vfe: AnimationDef = {
  id: 'vfe',
  cycleSec: 16,
  svg,
  phases: [
    { until: 0.25, caption: 'Warm up: soft nasal “ee” on a comfortable mid pitch, as long as you can. Twice.' },
    { until: 0.45, caption: 'Stretch: glide low to high on “knoll”. Twice.' },
    { until: 0.65, caption: 'Contract: glide high to low on “knoll”. Twice.' },
    { until: 1, caption: 'Adduction: sustain “ol” softly on five successive pitches. Twice each.' },
  ],
};
