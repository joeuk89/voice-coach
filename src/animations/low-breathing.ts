import type { AnimationDef } from '../types';
import { airStream } from './parts';
import './low-breathing.css';

const cells = Array.from({ length: 11 }, (_, i) => 30 + 25 * (i + 1));

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <circle class="body lb-chest" cx="120" cy="70" r="24"/>
  <text class="anim-label" x="156" y="74">CHEST · still</text>

  <circle class="body lb-belly" cx="120" cy="150" r="50"/>
  <text class="anim-label" x="192" y="154">BELLY · out</text>
  <ellipse class="body lb-hand" cx="170" cy="150" rx="9" ry="22"/>

  <g class="lb-in">${airStream('M320 40 C 300 110, 220 118, 152 114')}</g>
  <g class="lb-out">
    ${airStream('M152 114 C 220 118, 300 110, 320 40')}
    <text class="lb-sss" x="326" y="38">sss</text>
  </g>

  <text class="anim-label" x="30" y="226">IN · 4</text>
  <text class="anim-label" x="130" y="226">OUT · “sss” · 8</text>
  <rect class="lb-track" x="30" y="236" width="300" height="16" rx="4"/>
  <rect class="lb-fill" x="30" y="236" width="300" height="16" rx="4"/>
  ${cells.map((x) => `<line class="lb-sep ${x === 130 ? 'lb-sep-major' : ''}" x1="${x}" y1="234" x2="${x}" y2="254"/>`).join('')}
</svg>`;

export const lowBreathing: AnimationDef = {
  id: 'low-breathing',
  cycleSec: 12,
  svg,
  phases: [
    { until: 1 / 3, caption: 'In through the nose for 4. The belly rises under your hand. The chest stays still.' },
    { until: 1, caption: 'Out on a steady “sss” for 8. Keep it even right to the end.' },
  ],
};
