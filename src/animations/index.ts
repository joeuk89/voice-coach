import type { AnimationDef, AnimationId } from '../types';
import { lipTrills } from './lip-trills';
import './shared.css';

const registry: Partial<Record<AnimationId, AnimationDef>> = {
  'lip-trills': lipTrills,
};

export function animationFor(id: AnimationId | null): AnimationDef | undefined {
  return id ? registry[id] : undefined;
}

export function captionAt(def: AnimationDef, progress: number): string {
  const phase = def.phases.find((p) => progress < p.until) ?? def.phases[def.phases.length - 1];
  return phase?.caption ?? '';
}

/**
 * Renders the animation card. The caption follows the loop by reading the
 * progress bar's own CSS animation clock, so it never drifts from the SVG.
 */
export function mountAnimation(container: HTMLElement, def: AnimationDef): () => void {
  container.innerHTML = `
    <div class="anim anim-${def.id}" style="--cycle:${def.cycleSec}s">${def.svg}</div>
    <div class="anim-caption"></div>
    <div class="anim-progress"><i></i></div>`;
  const caption = container.querySelector<HTMLElement>('.anim-caption')!;
  const bar = container.querySelector<HTMLElement>('.anim-progress i')!;
  const cycleMs = def.cycleSec * 1000;
  let raf = 0;
  let lastText = '';
  const startedAt = performance.now();

  function frame() {
    const clock = bar.getAnimations()[0];
    const t = typeof clock?.currentTime === 'number' ? clock.currentTime : performance.now() - startedAt;
    const progress = (t % cycleMs) / cycleMs;
    const text = captionAt(def, progress);
    if (text !== lastText) {
      lastText = text;
      caption.textContent = text;
    }
    raf = requestAnimationFrame(frame);
  }
  frame();
  return () => cancelAnimationFrame(raf);
}
