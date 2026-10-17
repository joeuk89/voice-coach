import { $, esc } from '../lib/dom';
import { buzz } from '../lib/haptics';
import { localDay } from '../state/log';
import { bestEver, previousBest, recordSustain, removeLastSustain, todaySustains } from '../state/sustains';

function fmt(sec: number): string {
  return `${sec.toFixed(1)} s`;
}

export interface SustainEvents {
  onRecord?: () => void;
  onUndo?: () => void;
}

export interface SustainPanel {
  /** Forget the holds recorded so far, so Undo only reaches holds from the next sub-step on. */
  resetStep(): void;
  stop(): void;
}

/** Tap-to-start, tap-to-stop stopwatch for sustained notes; each hold is logged for the day. */
export function mountSustainPanel(container: HTMLElement, events: SustainEvents = {}): SustainPanel {
  let startedAt = 0;
  let interval: ReturnType<typeof setInterval> | undefined;
  let stepHolds: string[] = [];

  function draw() {
    const today = todaySustains();
    const best = bestEver();
    const prev = previousBest();
    const running = interval !== undefined;
    container.innerHTML = `
      <div class="sustain-head">
        <h2>Sustain timer</h2>
        <span class="muted">${prev ? `Last time ${esc(fmt(prev))}` : 'First time'}${best ? ` · Best ${esc(fmt(best))}` : ''}</span>
      </div>
      <div class="sustain-row">
        <div class="sustain-clock mono" id="sustain-clock">${fmt(running ? elapsed() : 0)}</div>
        <button class="btn btn-primary sustain-btn ${running ? 'running' : ''}" id="sustain-toggle">${running ? 'Stop' : 'Start hold'}</button>
      </div>
      <div class="sustain-today">
        ${
          today.length
            ? `<span class="muted">Today:</span> ${today.map((s) => `<span class="chip mono">${esc(fmt(s))}</span>`).join('')}
               ${stepHolds.length && !running ? '<button class="btn btn-ghost btn-small" id="sustain-undo" aria-label="Undo last hold">Undo</button>' : ''}`
            : '<span class="muted">Tap Start when the note begins, Stop when it ends.</span>'
        }
      </div>`;

    $(container, '#sustain-toggle').addEventListener('click', toggle);
    container.querySelector('#sustain-undo')?.addEventListener('click', undo);
  }

  function elapsed() {
    return (Date.now() - startedAt) / 1000;
  }

  function undo() {
    const day = stepHolds.pop();
    if (day === undefined) return;
    removeLastSustain(day);
    draw();
    events.onUndo?.();
  }

  function toggle() {
    if (interval) {
      const held = elapsed();
      const day = localDay();
      stop();
      const recorded = held >= 0.5 && recordSustain(held, day);
      if (recorded) stepHolds.push(day);
      buzz(40);
      draw();
      // After buzz(40), so a listener's own buzz replaces the short one.
      if (recorded) events.onRecord?.();
      return;
    }
    startedAt = Date.now();
    const button = $(container, '#sustain-toggle');
    button.textContent = 'Stop';
    button.classList.add('running');
    container.querySelector('#sustain-undo')?.remove();
    interval = setInterval(() => {
      const clock = container.querySelector('#sustain-clock');
      if (clock) clock.textContent = fmt(elapsed());
    }, 100);
  }

  function stop() {
    if (interval) clearInterval(interval);
    interval = undefined;
  }

  draw();
  return {
    resetStep() {
      if (!stepHolds.length) return;
      stepHolds = [];
      draw();
    },
    stop,
  };
}
