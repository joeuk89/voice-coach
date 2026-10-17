/** Shared SVG fragments so every exercise draws pitch, air and sound the same way. */

export interface PitchStripOptions {
  top: number;
  bottom: number;
  path: string;
  className?: string;
  left?: number;
  right?: number;
  /** Omit the single trace line; the caller draws its own segments. */
  trace?: boolean;
  /** Omit the dot; the caller draws its own. */
  dot?: boolean;
}

/** Two axis lines labelled HIGH/LOW, a pitch trace that reveals along pathLength, and a dot. */
export function pitchStrip({ top, bottom, path, className = '', left = 60, right = 344, trace = true, dot = true }: PitchStripOptions): string {
  return `
  <g class="pitch ${className}">
    <text class="anim-label" x="20" y="${top + 4}">HIGH</text>
    <text class="anim-label" x="20" y="${bottom + 4}">LOW</text>
    <line class="pitch-axis" x1="${left}" y1="${top}" x2="${right}" y2="${top}"/>
    <line class="pitch-axis" x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}"/>
    ${trace ? `<path class="pitch-line" pathLength="1" d="${path}"/>` : ''}
    ${dot ? '<circle class="pitch-dot" r="6"/>' : ''}
  </g>`;
}

/** Three expanding sound arcs opening to the right of (cx, cy). */
export function rings(cx: number, cy: number, r: number, className = ''): string {
  const arc = `M${cx} ${cy - r} a ${r} ${r} 0 0 1 0 ${2 * r}`;
  const origin = `transform-origin:${cx}px ${cy}px`;
  return `
  <g class="rings ${className}">
    <path class="ring" d="${arc}" style="${origin}"/>
    <path class="ring" d="${arc}" style="${origin};animation-delay:0.4s"/>
    <path class="ring" d="${arc}" style="${origin};animation-delay:0.8s"/>
  </g>`;
}

/** Amber dashed stream flowing from the start of the path to its end. */
export function airStream(path: string, className = ''): string {
  return `<path class="air ${className}" d="${path}"/>`;
}

/** Two rose lip bars; the gap between them is where air or a straw passes. */
export function lipBars(x: number, y: number, width: number, gap: number, className = ''): string {
  const h = 16;
  return `
  <rect class="lip lip-upper ${className}" x="${x}" y="${y - gap / 2 - h}" width="${width}" height="${h}" rx="${h / 2}"/>
  <rect class="lip lip-lower ${className}" x="${x}" y="${y + gap / 2}" width="${width}" height="${h}" rx="${h / 2}"/>`;
}
