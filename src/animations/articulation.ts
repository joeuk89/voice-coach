import type { AnimationDef } from '../types';
import { airStream, easyPitchY, lip, pitchStrip, pitchTrace, rings } from './parts';
import './articulation.css';

const top = 216;
const bottom = 268;
const easy = easyPitchY(top, bottom);

const easyPath = `M60 ${easy} L344 ${easy}`;
/** The sigh starts at HIGH and settles to LOW, falling fastest in the middle as a sigh does. */
const sighPath = `M60 ${top} C 150 ${top}, 254 ${bottom}, 344 ${bottom}`;

/**
 * The step 4 twister as it lights, one part per syllable. The quotes ride on the first and last part,
 * and each later word carries its leading space, so the parts join back into the example chip.
 */
export const twisterParts = ['“Red', ' lea', 'ther,', ' yel', 'low', ' lea', 'ther”'];

const twister = twisterParts.map((part, i) => `<tspan class="ar-syl ar-syl-${i + 1}">${part}</tspan>`).join('');

const voiceLabel = (state: string) => `<text class="anim-label" x="60" y="206">VOICE · ${state}</text>`;
const partLabel = (text: string, className: string) => `<text class="anim-label ${className}" x="232" y="138">${text}</text>`;

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <path class="body" d="M72 32 H160 Q168 32 168 40 V70 C 146 70, 130 54, 106 54 C 88 54, 74 58, 64 64 V40 Q64 32 72 32 Z"/>
  ${lip(156, 58)}

  <g class="ar-jaw">
    <rect class="body" x="64" y="82" width="104" height="30" rx="8"/>
    <path class="ar-tongue" d="M74 82 C 74 68, 90 60, 108 61 C 120 62, 126 70, 132 72 L 132 82 Z"/>
    <g class="ar-tip-still"><rect class="ar-tongue ar-tip-tap" x="122" y="72" width="32" height="10" rx="5"/></g>
    <g class="ar-tip-trill"><rect class="ar-tongue ar-tip-flutter" x="122" y="72" width="32" height="10" rx="5"/></g>
    ${lip(156, 80)}
  </g>

  <g class="ar-massage">
    <g transform="translate(90 100) rotate(-25)"><rect class="ar-finger" x="-7" y="-50" width="14" height="50" rx="7"/></g>
    <g transform="translate(110 104) rotate(-25)"><rect class="ar-finger ar-finger-2" x="-7" y="-50" width="14" height="50" rx="7"/></g>
    <text class="anim-label" x="232" y="82">LIPS · soft</text>
  </g>

  <g class="ar-sigh">
    ${airStream('M228 100 L 330 100')}
    <text class="anim-say" x="292" y="89" text-anchor="middle">“hah”</text>
  </g>
  <g class="ar-trill">
    ${rings(226, 82, 18)}
    <text class="anim-say" x="292" y="89" text-anchor="middle">“rrr”</text>
  </g>

  ${partLabel('JAW · loose', 'ar-p1')}
  ${partLabel('JAW · wide', 'ar-p2')}
  ${partLabel('TONGUE · trill', 'ar-p3')}
  ${partLabel('TONGUE · quick', 'ar-p4')}

  <text class="anim-say ar-twister" x="202" y="174" text-anchor="middle">${twister}</text>

  ${pitchStrip({ top, bottom, className: 'ar-pitch', trace: false, dot: false })}
  <g class="ar-t-off">${voiceLabel('off')}</g>
  ${pitchTrace(sighPath, 'ar-t-sigh', voiceLabel('sigh'))}
  ${pitchTrace(easyPath, 'ar-t-trill', voiceLabel('easy'))}
  ${pitchTrace(easyPath, 'ar-t-speak', voiceLabel('speak'))}
</svg>`;

export const articulation: AnimationDef = {
  id: 'articulation',
  cycleSec: 16,
  svg,
  phases: [
    { until: 0.25, caption: 'Massage the jaw muscles with your fingertips and let the jaw hang loose. Teeth apart, lips soft.' },
    { until: 0.5, caption: 'Yawn-sigh: yawn with the mouth wide, then sigh out on a gentle “hah” from high to low.' },
    { until: 0.75, caption: 'Tongue trill: a rolled “rrr” on one easy pitch. If it won’t go, fast “la-la-la” or “ttt-ddd” instead.' },
    { until: 1, caption: 'Tongue twisters, each twice: slow and over-articulated first, then at speaking pace.' },
  ],
};
