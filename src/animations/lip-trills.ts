import type { AnimationDef } from '../types';
import { pitchStrip } from './parts';
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

  <text class="anim-label" x="80" y="88">LIPS</text>
  <path class="lt-air" d="M16 126 L 344 126"/>
  <rect class="lt-lip lt-lip-upper" x="80" y="104" width="100" height="18" rx="9"/>
  <rect class="lt-lip lt-lip-lower" x="80" y="130" width="100" height="18" rx="9"/>

  <g class="lt-buzz">
    <path d="M190 112 q 6 14 0 28"/>
    <path d="M197 107 q 9 19 0 38"/>
  </g>

  <g class="lt-rings">
    <path d="M184 90 a 36 36 0 0 1 0 72"/>
    <path d="M184 90 a 36 36 0 0 1 0 72"/>
    <path d="M184 90 a 36 36 0 0 1 0 72"/>
  </g>

  <g class="lt-tip">
    <path class="lt-finger-outline" d="M18 54 L 64 100"/>
    <path class="lt-finger" d="M18 54 L 64 100"/>
    <path class="lt-finger-outline" d="M18 198 L 64 152"/>
    <path class="lt-finger" d="M18 198 L 64 152"/>
    <circle class="lt-press lt-press-a" cx="66" cy="100" r="9"/>
    <circle class="lt-press lt-press-b" cx="66" cy="152" r="9"/>
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
    { until: 1, caption: 'Lips won’t go? Press your cheeks lightly with two fingertips.' },
  ],
};
