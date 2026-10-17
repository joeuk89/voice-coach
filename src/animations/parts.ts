/** Shared SVG fragments so every exercise draws pitch, air and sound the same way. */

export interface PitchStripOptions {
  top: number;
  bottom: number;
  path?: string;
  className?: string;
  left?: number;
  right?: number;
  /** Omit the single trace line; the caller draws its own traces. */
  trace?: boolean;
  /** Omit the dot; the caller draws its own. */
  dot?: boolean;
}

/** Height of the comfortable speaking pitch as a fraction of the strip, measured up from LOW. */
const EASY_FRACTION = 0.35;

export function easyPitchY(top: number, bottom: number): number {
  return Math.round(bottom - EASY_FRACTION * (bottom - top));
}

/** HIGH/LOW axis lines, a dashed comfortable-pitch line, and optionally one trace that reveals along pathLength with a dot. */
export function pitchStrip({ top, bottom, path = '', className = '', left = 60, right = 344, trace = true, dot = true }: PitchStripOptions): string {
  const easy = easyPitchY(top, bottom);
  return `
  <g class="pitch ${className}">
    <text class="anim-label" x="${left - 14}" y="${top + 4}" text-anchor="end">HIGH</text>
    <text class="anim-label" x="${left - 14}" y="${easy + 4}" text-anchor="end">EASY</text>
    <text class="anim-label" x="${left - 14}" y="${bottom + 4}" text-anchor="end">LOW</text>
    <line class="pitch-axis" x1="${left}" y1="${top}" x2="${right}" y2="${top}"/>
    <line class="pitch-easy" x1="${left}" y1="${easy}" x2="${right}" y2="${easy}"/>
    <line class="pitch-axis" x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}"/>
    ${trace ? `<path class="pitch-line" pathLength="1" d="${path}"/>` : ''}
    ${dot ? '<circle class="pitch-dot" r="6"/>' : ''}
  </g>`;
}

/** A pitch trace with its own dot, for cards that swap one trace per phase. */
export function pitchTrace(path: string, className: string, extra = ''): string {
  return `
  <g class="${className}">
    ${extra}
    <path class="pitch-line" pathLength="1" d="${path}"/>
    <circle class="pitch-dot" r="6" style="offset-path: path('${path}')"/>
  </g>`;
}

type RingRadius = 18 | 32;

/** Three expanding sound arcs opening to the right of (cx, cy). */
export function rings(cx: number, cy: number, r: RingRadius, className = ''): string {
  const arc = `M${cx} ${cy - r} a ${r} ${r} 0 0 1 0 ${2 * r}`;
  const origin = `transform-origin:${cx}px ${cy}px`;
  return `
  <g class="rings ${className}">
    <path class="ring" d="${arc}" style="${origin}"/>
    <path class="ring" d="${arc}" style="${origin};animation-delay:0.4s"/>
    <path class="ring" d="${arc}" style="${origin};animation-delay:0.8s"/>
  </g>`;
}

/** One lip, the same size on every card. */
export function lip(x: number, y: number, className = ''): string {
  return `<rect class="lip ${className}" x="${x}" y="${y}" width="64" height="16" rx="8"/>`;
}

/** The end point of a path and the direction it is heading there. Handles the absolute M, L, H, V and C commands the cards use. */
function pathEnd(path: string): { x: number; y: number; dx: number; dy: number } {
  const tokens = path.match(/[MLHVC]|-?\d*\.?\d+/g) ?? [];
  let x = 0;
  let y = 0;
  let fromX = 0;
  let fromY = 0;
  let command = 'M';
  for (let i = 0; i < tokens.length; ) {
    if (/[MLHVC]/.test(tokens[i]!)) command = tokens[i++]!;
    const n = () => Number(tokens[i++]);
    if (command === 'C') {
      n();
      n();
      fromX = n();
      fromY = n();
      x = n();
      y = n();
      continue;
    }
    fromX = x;
    fromY = y;
    if (command === 'H') x = n();
    else if (command === 'V') y = n();
    else {
      x = n();
      y = n();
    }
  }
  return { x, y, dx: x - fromX, dy: y - fromY };
}

/** Amber dashed stream flowing from the start of the path to its end, where a chevron shows the direction. */
export function airStream(path: string, className = ''): string {
  const { x, y, dx, dy } = pathEnd(path);
  const length = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [dx / length, dy / length];
  const arm = (side: number) => `${(x - 7 * ux + side * 5 * uy).toFixed(1)} ${(y - 7 * uy - side * 5 * ux).toFixed(1)}`;
  return `<g class="air-stream ${className}"><path class="air" d="${path}"/><path class="air-head" d="M${arm(1)} L${x} ${y} L${arm(-1)}"/></g>`;
}

/** The AIR lane under the anatomy: a track, filled amber while air flows. */
export function airLane(y: number, fillClass = ''): string {
  return `
  <rect class="lane-track" x="60" y="${y}" width="284" height="10" rx="5"/>
  <rect class="lane-fill ${fillClass}" x="60" y="${y}" width="284" height="10" rx="5"/>`;
}
