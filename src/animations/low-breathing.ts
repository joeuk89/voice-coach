import type { AnimationDef } from '../types';
import { airStream } from './parts';
import './low-breathing.css';

const airIn = 'M186 32 C 164 32, 141 31, 140 40 C 139 49, 156 66, 156 88 C 156 106, 150 122, 126 146';
const airOut = 'M126 146 C 150 122, 156 106, 156 88 C 156 66, 139 49, 140 40 C 141 31, 164 32, 186 32';

const cells = Array.from({ length: 11 }, (_, i) => 30 + 25 * (i + 1));

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <circle class="body lb-head" cx="110" cy="34" r="20"/>
  <path class="body lb-nose" d="M127 27 L137 36 L127 41"/>

  <rect class="body lb-chest" x="76" y="62" width="68" height="50" rx="18"/>
  <text class="anim-label" x="176" y="91">CHEST · still</text>

  <circle class="body lb-belly" cx="110" cy="160" r="42"/>
  <text class="anim-label" x="176" y="164">BELLY · out</text>
  <ellipse class="body lb-hand" cx="152" cy="160" rx="8" ry="20"/>

  <g class="lb-in">${airStream(airIn)}</g>
  <g class="lb-out">
    ${airStream(airOut)}
    <text class="lb-sss" x="192" y="36">sss</text>
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
