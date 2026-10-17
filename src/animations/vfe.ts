import type { AnimationDef } from '../types';
import { easyPitchY, pitchStrip, pitchTrace } from './parts';
import { mountVfeHolds, PITCHES, pitchYs, treadEnds } from './vfe-holds';
import './vfe.css';

const top = 96;
const bottom = 256;
const easy = easyPitchY(top, bottom);

const names = ['WARM UP', 'STRETCH', 'CONTRACT', 'ADDUCTION'];

const steps = [
  `M60 ${easy} L344 ${easy}`,
  `M60 ${bottom} C 160 ${bottom}, 240 ${top}, 344 ${top}`,
  `M60 ${top} C 164 ${top}, 244 ${bottom}, 344 ${bottom}`,
];

/** Adduction on the free loop: five treads drawn one at a time, the dot lifting off between them. */
const treads = Array.from({ length: PITCHES }, (_, i) => {
  const [x1, x2] = treadEnds(i);
  const d = `M${x1} ${pitchYs[i]} H${x2}`;
  return `
    <path class="pitch-line vf-tread-${i + 1}" pathLength="1" d="${d}"/>
    <circle class="pitch-dot vf-tread-dot vf-tread-dot-${i + 1}" r="6" style="offset-path: path('${d}')"/>`;
}).join('');

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  ${names.map((_, i) => `<circle class="vf-pip vf-pip-${i + 1}" cx="${26 + 20 * i}" cy="25" r="6"/>`).join('')}
  ${names.map((name, i) => `<text class="anim-label vf-name vf-name-${i + 1}" x="106" y="30">${name}</text>`).join('')}

  <g class="vf-watch">
    <circle class="body" cx="320" cy="50" r="18"/>
    <rect class="vf-nub" x="317" y="26" width="6" height="6" rx="1"/>
    <line class="vf-hand" x1="320" y1="50" x2="320" y2="36"/>
    <text class="anim-label" x="320" y="86" text-anchor="middle">TIME IT</text>
  </g>

  ${pitchStrip({ top, bottom, className: 'vf-pitch', trace: false, dot: false })}
  <g class="vf-t vf-t-4">
    <text class="anim-say" x="72" y="232">“ol”</text>
    ${treads}
  </g>
  ${steps.map((d, i) => `<path class="vf-ghost vf-ghost-${i + 1}" d="${d}"/>`).join('')}

  ${pitchTrace(steps[0]!, 'vf-t vf-t-1', `<text class="anim-say" x="64" y="${easy - 12}">“ee”</text>`)}
  ${pitchTrace(steps[1]!, 'vf-t vf-t-2')}
  ${pitchTrace(steps[2]!, 'vf-t vf-t-3')}
</svg>`;

export const vfe: AnimationDef = {
  id: 'vfe',
  cycleSec: 20,
  svg,
  compactViewBox: '0 12 360 258',
  phases: [
    { until: 0.2, caption: 'Warm up: soft nasal “ee” on a comfortable mid pitch, as long as you can. Twice.' },
    { until: 0.36, caption: 'Stretch: glide low to high on “knoll”. Twice.' },
    { until: 0.52, caption: 'Contract: glide high to low on “knoll”. Twice.' },
    { until: 1, caption: 'Adduction: sustain “ol” softly on five successive pitches. Twice each, a fresh breath for each.' },
  ],
  holdPicture: mountVfeHolds,
};
