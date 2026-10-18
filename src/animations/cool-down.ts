import type { AnimationDef } from '../types';
import { airLane, airStream, easyPitchY, lip, pitchStrip, pitchTrace, rings } from './parts';
import './cool-down.css';

const top = 216;
const bottom = 268;
const easy = easyPitchY(top, bottom);

/** A short hum sliding down from `from` to `to`, easing out like a sigh. */
const slide = (left: number, from: number, to: number) => `M${left} ${from} C ${left + 28} ${from}, ${left + 48} ${to}, ${left + 76} ${to}`;

// Three slides, each starting a little lower than the last, from about the middle of the range.
const slides = [slide(60, 236, 256), slide(164, 242, 260), slide(268, 248, 264)];
const everydayPath = `M60 ${easy} L344 ${easy}`;

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <text class="anim-label cd-p1" x="30" y="62">LIPS · sealed</text>
  <text class="anim-label cd-p2" x="30" y="62">LIPS · at rest</text>

  <g class="cd-p1">
    <text class="anim-label" x="140" y="84">STRAW</text>
    <rect class="cd-straw" x="50" y="92" width="190" height="10" rx="3"/>
    ${airStream('M56 97 L 256 97', 'cd-air')}
  </g>
  ${lip(30, 76, 'cd-lip-upper')}
  ${lip(30, 102, 'cd-lip-lower')}

  <g class="cd-p1">
    <g class="cd-fade">
      ${rings(262, 97, 18)}
      <text class="anim-say cd-say" x="292" y="102">“mmm”</text>
    </g>
  </g>
  <g class="cd-p2">
    ${rings(98, 97, 18, 'cd-speak-rings')}
    <text class="anim-say cd-say" x="128" y="102">“Put the kettle on.”</text>
  </g>

  <text class="anim-label" x="60" y="172">AIR · gentle</text>
  ${airLane(178, 'cd-lane')}

  ${pitchStrip({ top, bottom, trace: false, dot: false })}
  <text class="anim-label cd-p1" x="60" y="206">VOICE · soft slide</text>
  <text class="anim-label cd-p2" x="60" y="206">VOICE · everyday</text>
  ${slides.map((path, i) => `<g class="cd-soft-${i + 1}">${pitchTrace(path, `cd-t cd-t-${i + 1}`)}</g>`).join('')}
  ${pitchTrace(everydayPath, 'cd-t cd-t-everyday')}
</svg>`;

export const coolDown: AnimationDef = {
  id: 'cool-down',
  cycleSec: 12,
  svg,
  phases: [
    { until: 0.75, caption: 'Straw or loose lips: gentle hums sliding down from the middle of your range, each one softer than the last.' },
    { until: 1, caption: 'Swallow, let the shoulders drop, and say one easy sentence in your everyday voice.' },
  ],
};
