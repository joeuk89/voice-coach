import type { AnimationDef } from '../types';
import { lip, rings } from './parts';
import './hum.css';

/** Where a two-part sound word splits: the prefix ends here and the suffix that lights up starts here. */
const split = 252;

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <line class="hm-airway" x1="80" y1="48" x2="80" y2="170"/>

  <rect class="body" x="66" y="34" width="52" height="14" rx="7"/>
  ${rings(122, 41, 18, 'hm-nose-rings')}
  <text class="anim-label" x="152" y="46">NOSE · buzz</text>

  ${lip(80, 98)}
  ${lip(80, 116, 'hm-lower')}
  <text class="anim-say hm-ah-mouth" x="112" y="131" text-anchor="middle">“ah”</text>
  ${rings(148, 115, 32, 'hm-lip-rings')}
  <text class="anim-label" x="198" y="110">LIPS · buzz</text>

  <text class="anim-say hm-show-1" x="198" y="138">“mmm”</text>
  <text class="anim-say hm-prefix" x="${split}" y="138" text-anchor="end">“mmm-</text>
  <text class="anim-say hm-ah" x="${split}" y="138">ah”</text>
  <text class="anim-say hm-many" x="${split}" y="138">many”</text>
  <text class="anim-say hm-money" x="${split}" y="138">money”</text>
  <text class="anim-say hm-morning" x="${split}" y="138">morning”</text>

  <rect class="hm-throat" x="66" y="170" width="28" height="92" rx="14"/>
  <text class="anim-label" x="108" y="220">THROAT · relaxed</text>
</svg>`;

export const hum: AnimationDef = {
  id: 'hum',
  cycleSec: 12,
  svg,
  phases: [
    { until: 0.3, caption: '“Mmm” with lips closed. Feel the buzz in the lips and nose, not pressure in the throat.' },
    { until: 0.55, caption: '“Mmm-ah”. Keep the buzz as the mouth opens.' },
    { until: 0.8, caption: '“Mmm-many”, “mmm-money”. Same forward, easy feel.' },
    { until: 1, caption: 'Short phrases with the same quality. This is the speaking voice now.' },
  ],
};
