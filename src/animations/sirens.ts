import type { AnimationDef } from '../types';
import { pitchStrip, rings } from './parts';
import './sirens.css';

const pitchPath = 'M120 226 C 160 226, 180 86, 230 86 C 280 86, 300 236, 336 236';

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <ellipse class="sr-mouth" cx="60" cy="160" rx="16" ry="22"/>
  <text class="sr-oo" x="60" y="165" text-anchor="middle">oo</text>
  ${rings(84, 160, 34)}
  ${pitchStrip({ top: 90, bottom: 230, left: 110, path: pitchPath, className: 'sr-pitch' })}
  <text class="anim-label sr-edge" x="340" y="80" text-anchor="end">just past comfortable</text>
</svg>`;

export const sirens: AnimationDef = {
  id: 'sirens',
  cycleSec: 8,
  svg,
  phases: [
    { until: 0.5, caption: 'Hum or “oo”. Glide from the bottom of your range to the top, smooth like a distant siren.' },
    { until: 1, caption: 'Nudge gently past the comfortable edges on each pass.' },
  ],
};
