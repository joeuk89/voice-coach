import type { AnimationDef } from '../types';
import { airStream, pitchStrip, rings } from './parts';
import './straw.css';

const pitchPath =
  'M70 248 L140 248 C 165 248, 180 200, 205 200 C 230 200, 240 248, 262 248 C 270 238, 278 252, 288 242 C 296 234, 304 250, 314 240 C 320 236, 326 248, 334 242';

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <text class="anim-label" x="36" y="96">LIPS · sealed</text>
  <text class="anim-label" x="130" y="112">STRAW</text>

  <rect class="st-straw" x="60" y="124" width="170" height="10" rx="3"/>
  ${airStream('M64 129 L 226 129', 'st-air')}
  ${airStream('M232 129 L 262 120', 'st-spray')}
  ${airStream('M232 129 L 266 129', 'st-spray')}
  ${airStream('M232 129 L 262 138', 'st-spray')}

  <rect class="lip" x="40" y="106" width="44" height="16" rx="8"/>
  <rect class="lip" x="40" y="136" width="44" height="16" rx="8"/>

  ${rings(236, 129, 30, 'st-rings')}

  ${pitchStrip({ top: 200, bottom: 248, path: pitchPath, className: 'st-pitch' })}
  <text class="anim-label st-hum" x="105" y="238" text-anchor="middle">hum</text>
  <text class="anim-label st-siren" x="205" y="190" text-anchor="middle">siren</text>
  <text class="anim-label st-speak" x="298" y="226" text-anchor="middle">speak · tune</text>
</svg>`;

export const straw: AnimationDef = {
  id: 'straw',
  cycleSec: 12,
  svg,
  phases: [
    { until: 0.12, caption: 'Thin stirring straw between the lips. No air leaking around it.' },
    { until: 0.3, caption: 'Hum gently through the straw on a comfortable pitch.' },
    { until: 0.7, caption: 'Slow sirens through the straw: low to high to low, smooth.' },
    { until: 1, caption: '“Speak” a sentence or hum a tune through it.' },
  ],
};
