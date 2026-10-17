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
  <text class="hm-say hm-say-1" x="204" y="160">“mmm”</text>
  <text class="hm-say hm-say-2" x="204" y="160">“mmm-ah”</text>
  <text class="hm-say hm-say-3" x="204" y="160">“mmm-many”</text>
  <text class="hm-say hm-say-4" x="204" y="160">short phrases</text>
  <g class="hm-beats hm-beats-words">
    <circle cx="212" cy="178" r="4"/><circle cx="224" cy="178" r="2.5"/>
    <path d="M206 186 v4 h24 v-4"/>
    <circle cx="250" cy="178" r="4"/><circle cx="262" cy="178" r="2.5"/>
    <path d="M244 186 v4 h24 v-4"/>
  </g>
  <g class="hm-beats hm-beats-phrase">
    <circle cx="210" cy="178" r="2.5"/><circle cx="222" cy="178" r="3.5"/><circle cx="234" cy="178" r="2"/>
    <circle cx="246" cy="178" r="4"/><circle cx="258" cy="178" r="2.5"/><circle cx="270" cy="178" r="3"/>
    <circle cx="282" cy="178" r="2"/>
    <path d="M204 186 v4 h84 v-4"/>
  </g>

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
