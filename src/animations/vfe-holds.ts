import type { HoldPicture, HoldPlayer } from '../types';

export const PITCHES = 5;
const LEFT = 60;
const WIDTH = 284;
const TREAD = WIDTH / PITCHES;
/** Treads and their halves stop this short of their ends, so neighbours never touch. */
const GAP = 3;
export const pitchYs = [242, 214, 186, 158, 130];

/** A hold's line grows by this time constant: about two thirds drawn at 8 s, nearly full by 30 s, never quite complete. */
export const HOLD_TAU_MS = 8000;
export const HOP_MS = 400;
const HOP_LIFT = 14;
/** The sliver of the loop the player holds while the picture follows the counter. */
const PARK_SPAN = 0.001;

export interface Segment {
  x1: number;
  x2: number;
  y: number;
}

export function treadEnds(pitch: number): [number, number] {
  const x1 = LEFT + TREAD * pitch + GAP;
  return [round(x1), round(x1 + TREAD - 2 * GAP)];
}

/** One hold's line: the `rep`th slice of its pitch's tread. */
export function segments(repsPerPitch: number): Segment[] {
  const width = TREAD / repsPerPitch;
  return Array.from({ length: PITCHES * repsPerPitch }, (_, i) => {
    const pitch = Math.floor(i / repsPerPitch);
    const x1 = LEFT + TREAD * pitch + width * (i % repsPerPitch) + GAP;
    return { x1: round(x1), x2: round(x1 + width - 2 * GAP), y: pitchYs[pitch]! };
  });
}

/** How much of its line a hold of `heldMs` has drawn, from 0 towards 1. */
export function holdFraction(heldMs: number): number {
  return 1 - Math.exp(-Math.max(0, heldMs) / HOLD_TAU_MS);
}

/** Where the dot sits with `count` holds recorded: the start of the next line, or the end of the last. */
export function restingPoint(segs: Segment[], count: number): { x: number; y: number } {
  const next = segs[count];
  if (next) return { x: next.x1, y: next.y };
  const last = segs[segs.length - 1]!;
  return { x: last.x2, y: last.y };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Adduction: five treads, one per pitch, each cut into one line per hold. A running hold draws its
 * line from the left and the dot rides its tip; a recorded hold keeps its length, and the dot hops to
 * the next line because the next hold is a new breath. The step's own staircase is hidden meanwhile.
 */
export function mountVfeHolds(container: HTMLElement, player: HoldPlayer, window: [number, number], repsPerPitch: number): HoldPicture {
  const anim = container.querySelector<HTMLElement>('.anim');
  const svg = container.querySelector('svg');
  if (!anim || !svg) return { setCount: () => undefined, setRunning: () => undefined, stop: () => undefined };

  const segs = segments(repsPerPitch);
  const treads = Array.from({ length: PITCHES }, (_, i) => {
    const [x1, x2] = treadEnds(i);
    return `<line class="vf-tread" x1="${x1}" y1="${pitchYs[i]}" x2="${x2}" y2="${pitchYs[i]}"/>`;
  }).join('');
  const lines = segs.map((s) => `<line class="vf-seg" pathLength="1" x1="${s.x1}" y1="${s.y}" x2="${s.x2}" y2="${s.y}"/>`).join('');
  svg.insertAdjacentHTML(
    'beforeend',
    `<g class="vf-live">
      <text class="anim-say" x="72" y="232">“ol”</text>
      ${treads}
      ${lines}
      <circle class="pitch-dot vf-live-dot" r="6"/>
    </g>`,
  );
  const live = svg.querySelector<SVGGElement>('.vf-live')!;
  const treadEls = live.querySelectorAll<SVGLineElement>('.vf-tread');
  const segEls = live.querySelectorAll<SVGLineElement>('.vf-seg');
  const dot = live.querySelector<SVGCircleElement>('.vf-live-dot')!;

  anim.classList.add('vf-held');
  container.classList.add('anim-held');
  player.setWindow([window[0], window[0] + PARK_SPAN]);

  let count = 0;
  let startedAt = 0;
  let raf = 0;
  let at = { x: 0, y: 0 };
  let discardPending = false;

  const translate = (x: number, y: number) => `translate(${x}px, ${y}px)`;

  function place(x: number, y: number) {
    at = { x, y };
    dot.style.transform = translate(x, y);
  }

  function hop(to: { x: number; y: number }) {
    const from = at;
    place(to.x, to.y);
    if (from.x === to.x && from.y === to.y) return;
    if (reducedMotion() || typeof dot.animate !== 'function') return;
    dot.animate(
      [
        { transform: translate(from.x, from.y) },
        { transform: translate((from.x + to.x) / 2, Math.min(from.y, to.y) - HOP_LIFT), offset: 0.5 },
        { transform: translate(to.x, to.y) },
      ],
      { duration: HOP_MS, easing: 'ease-in-out' },
    );
  }

  function draw(index: number, fraction: number) {
    const seg = segs[index];
    const el = segEls[index];
    if (!seg || !el) return;
    el.style.strokeDashoffset = String(1 - fraction);
    place(seg.x1 + fraction * (seg.x2 - seg.x1), seg.y);
  }

  function showCurrentTread() {
    const pitch = count < segs.length ? Math.floor(count / repsPerPitch) : -1;
    treadEls.forEach((el, i) => el.classList.toggle('current', i === pitch));
  }

  function frame() {
    draw(count, holdFraction(performance.now() - startedAt));
    raf = requestAnimationFrame(frame);
  }

  function stopDrawing() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  place(restingPoint(segs, 0).x, restingPoint(segs, 0).y);
  showCurrentTread();

  return {
    setCount(next) {
      discardPending = false;
      stopDrawing();
      count = next;
      segEls.forEach((el, i) => {
        if (i >= count) el.style.strokeDashoffset = '1';
      });
      showCurrentTread();
      hop(restingPoint(segs, count));
    },
    setRunning(running) {
      if (running) {
        discardPending = false;
        startedAt = performance.now();
        if (count < segs.length && !raf) raf = requestAnimationFrame(frame);
        return;
      }
      stopDrawing();
      // The panel reports the stop before it records the hold, so a stop with no record by the end of
      // that turn was a hold too short to count.
      discardPending = true;
      queueMicrotask(() => {
        if (!discardPending) return;
        discardPending = false;
        draw(count, 0);
      });
    },
    stop() {
      stopDrawing();
      discardPending = false;
      live.remove();
      anim.classList.remove('vf-held');
      container.classList.remove('anim-held');
    },
  };
}
