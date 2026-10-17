import type { AnimationDef } from '../types';
import { easyPitchY, pitchStrip, pitchTrace } from './parts';
import './vfe.css';

const top = 96;
const bottom = 256;
const easy = easyPitchY(top, bottom);

const names = ['WARM UP', 'STRETCH', 'CONTRACT', 'ADDUCTION'];

/** Adduction: five rising pitches, each held twice, drawn as a staircase whose treads are cut in two. */
const pitchWidth = 284 / 5;
const pitchYs = [242, 214, 186, 158, 130];
const stairs =
  `M60 ${pitchYs[0]}` + pitchYs.map((y, i) => `${i ? ` V${y}` : ''} H${(60 + pitchWidth * (i + 1)).toFixed(1)}`).join('');
const cuts = pitchYs
  .map((y, i) => {
    const x = (60 + pitchWidth * (i + 0.5)).toFixed(1);
    return `<line class="vf-cut" x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}"/>`;
  })
  .join('');

const steps = [
  `M60 ${easy} L344 ${easy}`,
  `M60 ${bottom} C 160 ${bottom}, 240 ${top}, 344 ${top}`,
  `M60 ${top} C 164 ${top}, 244 ${bottom}, 344 ${bottom}`,
];

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
    <path class="pitch-line" pathLength="1" d="${stairs}"/>
    ${cuts}
  </g>
  ${steps.map((d, i) => `<path class="vf-ghost vf-ghost-${i + 1}" d="${d}"/>`).join('')}

  ${pitchTrace(steps[0]!, 'vf-t vf-t-1', `<text class="anim-say" x="64" y="${easy - 12}">“ee”</text>`)}
  ${pitchTrace(steps[1]!, 'vf-t vf-t-2')}
  ${pitchTrace(steps[2]!, 'vf-t vf-t-3')}
  <g class="vf-t vf-t-4"><circle class="pitch-dot" r="6" style="offset-path: path('${stairs}')"/></g>
</svg>`;

export const vfe: AnimationDef = {
  id: 'vfe',
  cycleSec: 16,
  svg,
  compactViewBox: '0 12 360 254',
  phases: [
    { until: 0.25, caption: 'Warm up: soft nasal “ee” on a comfortable mid pitch, as long as you can. Twice.' },
    { until: 0.45, caption: 'Stretch: glide low to high on “knoll”. Twice.' },
    { until: 0.65, caption: 'Contract: glide high to low on “knoll”. Twice.' },
    { until: 1, caption: 'Adduction: sustain “ol” softly on five successive pitches. Twice each.' },
  ],
};
