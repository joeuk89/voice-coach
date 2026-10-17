import type { AnimationDef } from '../types';
import { pitchStrip, pitchTrace, rings } from './parts';
import './sirens.css';

const top = 60;
const bottom = 250;
/** The comfortable band sits this far inside HIGH and LOW; pass 2 goes past it by `overshoot`. */
const bandInset = 14;
const overshoot = 12;

const sirenPath = (low: number, high: number) => `M120 ${low} C 170 ${low}, 182 ${high}, 230 ${high} C 278 ${high}, 290 ${low}, 340 ${low}`;
const bandTop = top + bandInset;
const bandBottom = bottom - bandInset;

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <text class="anim-say" x="60" y="92" text-anchor="middle">“oo”</text>
  <ellipse class="sr-mouth" cx="60" cy="128" rx="16" ry="22"/>
  ${rings(84, 128, 32)}

  <rect class="sr-band" x="110" y="${bandTop}" width="234" height="${bandBottom - bandTop}"/>
  <line class="sr-band-edge" x1="110" y1="${bandTop}" x2="344" y2="${bandTop}"/>
  <line class="sr-band-edge" x1="110" y1="${bandBottom}" x2="344" y2="${bandBottom}"/>
  ${pitchStrip({ top, bottom, left: 110, className: 'sr-pitch', trace: false, dot: false })}
  ${pitchTrace(sirenPath(bandBottom, bandTop), 'sr-pass-1')}
  ${pitchTrace(sirenPath(bandBottom + overshoot, bandTop - overshoot), 'sr-pass-2')}
</svg>`;

export const sirens: AnimationDef = {
  id: 'sirens',
  cycleSec: 16,
  svg,
  phases: [
    { until: 0.5, caption: 'Hum or “oo”. Glide from the bottom of your range to the top and back, smooth like a distant siren.' },
    { until: 1, caption: 'Nudge gently past the comfortable edges on each pass.' },
  ],
};
