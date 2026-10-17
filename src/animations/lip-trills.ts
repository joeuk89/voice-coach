import type { AnimationDef } from '../types';
import { pitchStrip, rings } from './parts';
import './lip-trills.css';

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <defs>
    <linearGradient id="lt-air" gradientUnits="userSpaceOnUse" x1="16" y1="0" x2="344" y2="0">
      <stop offset="0" stop-color="var(--air)" stop-opacity="0.15"/>
      <stop offset="0.2" stop-color="var(--air)" stop-opacity="0.9"/>
      <stop offset="0.5" stop-color="var(--air)" stop-opacity="1"/>
      <stop offset="1" stop-color="var(--air)" stop-opacity="0.05"/>
    </linearGradient>
  </defs>

  <text class="anim-label" x="80" y="74">LIPS</text>
  <g class="lt-air-phase"><path class="lt-air" d="M16 126 L 344 126"/></g>
  <g class="lt-trill">
    <rect class="lip lt-lip-upper" x="80" y="104" width="100" height="18" rx="9"/>
    <rect class="lip lt-lip-lower" x="80" y="130" width="100" height="18" rx="9"/>
  </g>
  <g class="lt-open">
    <rect class="lip lt-open-upper" x="80" y="104" width="100" height="18" rx="9"/>
    <rect class="lip lt-open-lower" x="80" y="130" width="100" height="18" rx="9"/>
    <text class="lt-ah" x="130" y="132" text-anchor="middle">ah</text>
  </g>

  <g class="lt-buzz">
    <path d="M190 112 q 6 14 0 28"/>
    <path d="M197 107 q 9 19 0 38"/>
  </g>

  ${rings(184, 126, 36, 'lt-rings')}

  <g class="lt-say">
    <text class="lt-word lt-word-brrr" x="178" y="240" text-anchor="end">“brrr</text>
    <text class="lt-word lt-word-ah" x="178" y="240">-ah”</text>
  </g>

  ${pitchStrip({ top: 208, bottom: 256, path: 'M70 256 L150 256 C 180 256, 200 208, 230 208 C 260 208, 285 256, 320 256', className: 'lt-pitch' })}
</svg>`;

export const lipTrills: AnimationDef = {
  id: 'lip-trills',
  cycleSec: 10,
  svg,
  phases: [
    { until: 0.2, caption: 'Loose lips, not pursed. Blow gently until they buzz. No voice yet.' },
    { until: 0.4, caption: 'Add voice: “brrr” on one easy pitch.' },
    { until: 0.8, caption: 'Glide the buzz low to high and back down. Keep the air steady.' },
    { until: 1, caption: 'Add a vowel on the end: “brrr-ah”. Then a word.' },
  ],
};
