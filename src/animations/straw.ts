import type { AnimationDef } from '../types';
import { airLane, airStream, easyPitchY, lip, pitchStrip, pitchTrace, rings } from './parts';
import './straw.css';

const top = 216;
const bottom = 268;
const easy = easyPitchY(top, bottom);

const humPath = `M60 ${easy} L344 ${easy}`;
const sirenPath = `M60 ${bottom} C 130 ${bottom}, 150 ${top}, 202 ${top} C 254 ${top}, 274 ${bottom}, 344 ${bottom}`;
const speakPath = [
  `M60 ${easy}`,
  'C 72 236, 84 236, 96 246',
  'C 106 254, 116 254, 126 244',
  'C 138 230, 152 230, 164 242',
  'C 174 252, 186 256, 198 248',
  'C 210 238, 222 236, 234 246',
  'C 246 256, 258 252, 270 240',
  'C 282 228, 296 230, 308 244',
  'C 318 254, 332 258, 344 256',
].join(' ');

/** The first two lines of “God Save the King” as [semitones above the easy pitch, beats]. */
const tuneNotes: Array<[number, number]> = [
  [0, 1], [0, 1], [2, 1], [-1, 1.5], [0, 0.5], [2, 1],
  [4, 1], [4, 1], [5, 1], [4, 1.5], [2, 0.5], [0, 1],
];

function steppedPath(notes: Array<[number, number]>, left: number, right: number, semitonePx: number): string {
  const beatPx = (right - left) / notes.reduce((sum, [, beats]) => sum + beats, 0);
  const y = (step: number) => easy - step * semitonePx;
  let x = left;
  const parts = [`M${left} ${y(notes[0]![0])}`];
  notes.forEach(([step, beats], i) => {
    if (i > 0 && step !== notes[i - 1]![0]) parts.push(`L${x.toFixed(1)} ${y(step)}`);
    x += beats * beatPx;
    parts.push(`L${x.toFixed(1)} ${y(step)}`);
  });
  return parts.join(' ');
}

const tunePath = steppedPath(tuneNotes, 60, 344, 5);

const voiceLabel = (state: string) => `<text class="anim-label" x="60" y="206">VOICE · ${state}</text>`;

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <text class="anim-label st-before-air" x="30" y="62">LIPS · open</text>
  <text class="anim-label st-air-on" x="30" y="62">LIPS · sealed</text>
  <text class="anim-label" x="140" y="84">STRAW</text>

  <rect class="st-straw" x="50" y="92" width="190" height="10" rx="3"/>
  ${airStream('M56 97 L 256 97', 'st-air-on')}
  ${lip(30, 76, 'st-lip-upper')}
  ${lip(30, 102, 'st-lip-lower')}
  ${rings(262, 97, 32, 'st-rings')}

  <text class="anim-label st-before-air" x="60" y="172">AIR · off</text>
  <text class="anim-label st-air-on" x="60" y="172">AIR · on</text>
  ${airLane(178, 'st-air-on')}

  ${pitchStrip({ top, bottom, className: 'st-pitch', trace: false, dot: false })}
  <g class="st-t-place">${voiceLabel('off')}</g>
  ${pitchTrace(humPath, 'st-t-hum', voiceLabel('hum'))}
  ${pitchTrace(sirenPath, 'st-t-siren', voiceLabel('siren'))}
  ${pitchTrace(speakPath, 'st-t-speak', voiceLabel('speak'))}
  ${pitchTrace(tunePath, 'st-t-tune', voiceLabel('tune'))}
</svg>`;

export const straw: AnimationDef = {
  id: 'straw',
  cycleSec: 12,
  svg,
  phases: [
    { until: 0.12, caption: 'Thin stirring straw between the lips. No air leaking around it.' },
    { until: 0.3, caption: 'Hum gently through the straw on a comfortable pitch.' },
    { until: 0.64, caption: 'Slow sirens through the straw: low to high to low, smooth.' },
    { until: 0.82, caption: '“Speak” a sentence through it: “How are you today?”' },
    { until: 1, caption: 'Hum a tune through it: “God Save the King”.' },
  ],
};
