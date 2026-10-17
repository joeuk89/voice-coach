import type { AnimationDef } from '../types';
import { airStream } from './parts';
import './low-breathing.css';

const airIn = 'M193 50 C 178 47, 166 44, 154 44 C 138 44, 131 52, 131 64 L 131 175';
const airOut = 'M131 175 L 131 70 C 131 60, 140 57, 152 57 L 193 60';

const cells = Array.from({ length: 11 }, (_, i) => 30 + 25 * (i + 1));

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <rect class="body lb-neck" x="124" y="58" width="14" height="20" rx="4"/>
  <circle class="body lb-head" cx="131" cy="44" r="20"/>
  <path class="body lb-nose" d="M149 37 Q 168 44 149 51"/>

  <path class="body lb-belly" d="M96 120 H 148 C 171 120, 183.5 140, 183.5 163 C 183.5 188, 167 206, 140 206 H 114 Q 96 206, 96 188 Z"/>

  <path class="body lb-chest" d="M114 74 H 148 Q 166 74, 166 92 V 108 Q 166 126, 148 126 H 96 V 92 Q 96 74, 114 74 Z"/>
  <text class="anim-label" x="197" y="104">CHEST · still</text>

  <g class="lb-in">
    ${airStream(airIn)}
    <text class="anim-label" x="197" y="168">BELLY · out</text>
  </g>
  <g class="lb-out">
    ${airStream(airOut)}
    <text class="anim-say unvoiced" x="202" y="66">“sss”</text>
    <text class="anim-label" x="197" y="168">BELLY · in</text>
  </g>

  <text class="anim-label" x="30" y="230">IN · 4</text>
  <text class="anim-label" x="130" y="230">OUT · “sss” · 8</text>
  <rect class="lb-track" x="30" y="240" width="300" height="16" rx="4"/>
  <rect class="lb-fill" x="30" y="240" width="300" height="16" rx="4"/>
  ${cells.map((x) => `<line class="lb-sep ${x === 130 ? 'lb-sep-major' : ''}" x1="${x}" y1="238" x2="${x}" y2="258"/>`).join('')}
</svg>`;

export const lowBreathing: AnimationDef = {
  id: 'low-breathing',
  cycleSec: 12,
  svg,
  phases: [
    { until: 1 / 3, caption: 'In through the nose: the belly hand moves, the chest hand stays still.' },
    { until: 1, caption: 'Out on a steady “sss” for 8.' },
  ],
};
