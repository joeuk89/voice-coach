import type { AnimationDef } from '../types';
import { airLane, airStream, easyPitchY, lip, pitchStrip, pitchTrace, rings } from './parts';
import './lip-trills.css';

const top = 216;
const bottom = 268;
const easy = easyPitchY(top, bottom);

const easyPath = `M60 ${easy} L344 ${easy}`;
const glidePath = `M60 ${bottom} C 130 ${bottom}, 150 ${top}, 202 ${top} C 254 ${top}, 274 ${bottom}, 344 ${bottom}`;

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <text class="anim-label" x="108" y="104" text-anchor="end">LIPS · loose</text>
  <g class="lt-air-phase">${airStream('M130 100 L 300 100', 'lt-air')}</g>
  <g class="lt-trill">
    ${lip(120, 80, 'lt-lip-upper')}
    ${lip(120, 104, 'lt-lip-lower')}
  </g>
  <g class="lt-open">
    ${lip(120, 80, 'lt-open-upper')}
    ${lip(120, 104, 'lt-open-lower')}
    <text class="anim-say lt-ah" x="152" y="106" text-anchor="middle">“ah”</text>
  </g>

  <g class="lt-buzz">
    <path d="M192 88 q 6 12 0 24"/>
    <path d="M199 83 q 9 17 0 34"/>
  </g>

  ${rings(188, 100, 32, 'lt-rings')}

  <text class="anim-label" x="60" y="172">AIR · on</text>
  ${airLane(178)}

  ${pitchStrip({ top, bottom, className: 'lt-pitch', trace: false, dot: false })}
  <text class="anim-label lt-voice-off" x="60" y="206">VOICE · off</text>
  <text class="anim-label lt-voice-on" x="60" y="206">VOICE · on</text>
  <text class="anim-say lt-brrr" x="344" y="206" text-anchor="end">“brrr”</text>
  <g class="lt-say">
    <text class="anim-say" x="316" y="206" text-anchor="end">“brrr-</text>
    <text class="anim-say lt-say-ah" x="316" y="206">ah”</text>
  </g>
  ${pitchTrace(easyPath, 'lt-t-easy')}
  ${pitchTrace(glidePath, 'lt-t-glide')}
  ${pitchTrace(easyPath, 'lt-t-ah')}
</svg>`;

export const lipTrills: AnimationDef = {
  id: 'lip-trills',
  cycleSec: 10,
  svg,
  phases: [
    { until: 0.2, caption: 'Loose lips, not pursed. Blow gently until they buzz. No voice yet.' },
    { until: 0.4, caption: 'Add voice: “brrr” on one easy pitch.' },
    { until: 0.8, caption: 'Glide low to high, then high to low.' },
    { until: 1, caption: 'Add a vowel on the end: “brrr-ah”. Then a word.' },
  ],
};
