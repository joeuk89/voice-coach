import type { AnimationDef, AnimationId } from '../types';
import { hum } from './hum';
import { lipTrills } from './lip-trills';
import { lowBreathing } from './low-breathing';
import { readAloud } from './read-aloud';
import { sirens } from './sirens';
import { straw } from './straw';
import { vfe } from './vfe';
import { activeWindow, animationTime, isInnerLoop, windowProgress, windowTime, type LoopWindow } from './window';
import './shared.css';

const registry: Record<AnimationId, AnimationDef> = {
  'low-breathing': lowBreathing,
  straw,
  'lip-trills': lipTrills,
  sirens,
  hum,
  vfe,
  'read-aloud': readAloud,
};

export function animationFor(id: AnimationId | null): AnimationDef | undefined {
  return id ? registry[id] : undefined;
}

function captionAt(def: AnimationDef, progress: number): string {
  const phase = def.phases.find((p) => progress < p.until) ?? def.phases[def.phases.length - 1];
  return phase?.caption ?? '';
}

export interface AnimationPlayer {
  /** Loop only this slice of the cycle. Null or the whole loop plays everything freely. */
  setWindow(window: LoopWindow | null | undefined): void;
  /** Hold every part, inner loops included, at a fraction of the cycle until the next setWindow or restart. */
  scrubTo(fraction: number): void;
  /** Hold the start of the cycle and mark the card `.anim-resting`, so it can hide parts that belong to the cycle already running. */
  rest(): void;
  /** Play the whole loop from `fromMs` into the cycle, every part and the progress bar together. */
  restart(fromMs?: number): void;
  /** Freeze every part where it is, inner loops included, until the next setWindow, rest or restart. */
  pause(): void;
  stop(): void;
}

interface Part {
  animation: Animation;
  duration: number;
  delay: number;
}

/**
 * Renders the animation card. A window or scrub pauses the cycle-long animations and sets their
 * clocks each frame; inner loops keep their own rhythm. In a window the progress bar shows how far
 * through the window the loop is, and `.anim-windowed` lets a card hide whole-loop-only parts.
 */
export function mountAnimation(
  container: HTMLElement,
  def: AnimationDef,
  { caption = true, input }: { caption?: boolean; input?: string } = {},
): AnimationPlayer {
  const svg = typeof def.svg === 'function' ? def.svg(input) : def.svg;
  container.style.setProperty('--cycle', `${def.cycleSec}s`);
  container.innerHTML = `
    <div class="anim anim-${def.id}">${svg}</div>
    ${caption ? '<div class="anim-caption"></div>' : ''}
    <div class="anim-progress"><i></i></div>`;

  const animEl = container.querySelector<HTMLElement>('.anim')!;
  const captionEl = container.querySelector<HTMLElement>('.anim-caption');
  // Without the Web Animations API the parts cannot be clocked, so every part plays its whole loop.
  const canDrive = typeof container.getAnimations === 'function';
  const barClock = canDrive ? container.querySelector<HTMLElement>('.anim-progress i')!.getAnimations()[0] : undefined;
  const cycleMs = def.cycleSec * 1000;
  let parts: Part[] = [];
  let loopWindow: LoopWindow | null = null;
  let windowStartedAt = 0;
  let heldAt: number | null = null;
  let scrubbing = false;
  let raf = 0;
  let lastText = '';

  function collectParts() {
    if (!canDrive) return;
    parts = container
      .getAnimations({ subtree: true })
      .filter((a) => a !== barClock)
      .map((animation) => {
        const timing = animation.effect?.getTiming();
        return { animation, duration: Number(timing?.duration) || cycleMs, delay: Number(timing?.delay) || 0 };
      });
  }

  function hold(loopTime: number, includeInner: boolean, barTime: number) {
    heldAt = loopTime;
    for (const { animation, duration, delay } of parts) {
      if (!includeInner && isInnerLoop(duration, cycleMs)) continue;
      animation.pause();
      animation.currentTime = animationTime(loopTime, duration, delay);
    }
    if (barClock) {
      barClock.pause();
      barClock.currentTime = barTime;
    }
  }

  function showCaption() {
    if (!captionEl) return;
    const clock = barClock?.currentTime;
    const t = heldAt ?? (typeof clock === 'number' ? clock : 0);
    const text = captionAt(def, (t % cycleMs) / cycleMs);
    if (text !== lastText) {
      lastText = text;
      captionEl.textContent = text;
    }
  }

  function frame(now: number) {
    if (loopWindow && !scrubbing) {
      const t = windowTime(loopWindow, cycleMs, now - windowStartedAt);
      hold(t, false, windowProgress(loopWindow, cycleMs, t) * cycleMs);
    }
    showCaption();
    raf = requestAnimationFrame(frame);
  }

  function run() {
    const needed = Boolean(captionEl) || (loopWindow !== null && !scrubbing);
    if (needed && !raf) raf = requestAnimationFrame(frame);
    if (!needed && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  showCaption();
  run();

  function setResting(resting: boolean) {
    animEl.classList.toggle('anim-resting', resting);
  }

  function scrub(fraction: number) {
    scrubbing = true;
    setResting(false);
    animEl.classList.remove('anim-windowed');
    collectParts();
    hold(fraction * cycleMs, true, fraction * cycleMs);
    showCaption();
    run();
  }

  return {
    setWindow(next) {
      scrubbing = false;
      setResting(false);
      loopWindow = canDrive ? activeWindow(next) : null;
      animEl.classList.toggle('anim-windowed', loopWindow !== null);
      collectParts();
      if (loopWindow) {
        parts.forEach(({ animation, duration }) => {
          if (isInnerLoop(duration, cycleMs) && animation.playState === 'paused') animation.play();
        });
        windowStartedAt = performance.now();
        const t = windowTime(loopWindow, cycleMs, 0);
        hold(t, false, windowProgress(loopWindow, cycleMs, t) * cycleMs);
      } else {
        if (barClock && heldAt !== null) barClock.currentTime = heldAt;
        heldAt = null;
        parts.forEach(({ animation }) => animation.play());
        barClock?.play();
      }
      showCaption();
      run();
    },
    scrubTo: scrub,
    rest() {
      scrub(0);
      setResting(true);
    },
    restart(fromMs = 0) {
      scrubbing = false;
      loopWindow = null;
      heldAt = null;
      setResting(false);
      animEl.classList.remove('anim-windowed');
      collectParts();
      for (const { animation, duration, delay } of parts) {
        animation.currentTime = animationTime(fromMs, duration, delay);
        animation.play();
      }
      if (barClock) {
        barClock.currentTime = fromMs;
        barClock.play();
      }
      showCaption();
      run();
    },
    pause() {
      scrubbing = true;
      collectParts();
      parts.forEach(({ animation }) => animation.pause());
      barClock?.pause();
      run();
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
