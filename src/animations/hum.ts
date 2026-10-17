import type { AnimationDef } from '../types';
import { rings } from './parts';
import './hum.css';

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <circle class="body" cx="110" cy="64" r="10"/>
  <text class="anim-label" x="158" y="68">NOSE · buzz</text>
  ${rings(122, 64, 16, 'hm-nose-rings')}

  <rect class="lip" x="70" y="112" width="80" height="16" rx="8"/>
  <rect class="lip hm-lower" x="70" y="130" width="80" height="16" rx="8"/>
  <text class="anim-label" x="204" y="134">LIPS · buzz</text>
  ${rings(154, 129, 28, 'hm-lip-rings')}

  <rect class="hm-throat" x="96" y="186" width="28" height="70" rx="14"/>
  <text class="anim-label" x="134" y="218">THROAT · relaxed</text>
  <text class="anim-label" x="134" y="236">no pressure here</text>
</svg>`;

export const hum: AnimationDef = {
  id: 'hum',
  cycleSec: 12,
  svg,
  phases: [
    { until: 0.3, caption: '“Mmm.” Lips closed. Feel the buzz at the lips and nose, nothing in the throat.' },
    { until: 0.55, caption: '“Mmm-ah.” Open the mouth and keep the buzz forward.' },
    { until: 0.8, caption: '“Mmm-many”, “mmm-money.” Same easy, forward feel.' },
    { until: 1, caption: 'Short phrases now. This is your speaking voice.' },
  ],
};
