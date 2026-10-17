/** Shared SVG fragments so every exercise draws pitch, air and sound the same way. */

export interface PitchStripOptions {
  top: number;
  bottom: number;
  path: string;
  className?: string;
  left?: number;
  right?: number;
}

/** Two axis lines labelled HIGH/LOW, a pitch trace that reveals along pathLength, and a dot. */
export function pitchStrip({ top, bottom, path, className = '', left = 60, right = 344 }: PitchStripOptions): string {
  return `
  <g class="pitch ${className}">
    <text class="anim-label" x="20" y="${top + 4}">HIGH</text>
    <text class="anim-label" x="20" y="${bottom + 4}">LOW</text>
    <line class="pitch-axis" x1="${left}" y1="${top}" x2="${right}" y2="${top}"/>
    <line class="pitch-axis" x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}"/>
    <path class="pitch-line" pathLength="1" d="${path}"/>
    <circle class="pitch-dot" r="6"/>
  </g>`;
}
