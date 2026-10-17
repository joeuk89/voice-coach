import { $, esc } from '../lib/dom';
import { buzz } from '../lib/haptics';
import { localDay } from '../state/log';
import { bestEver, previousBest, recordSustain, removeLastSustain, todaySustains } from '../state/sustains';

function fmt(sec: number): string {
  return `${sec.toFixed(1)} s`;
}

/** Header line: last time and best ever before today's first hold, then today's best and best ever. */
export function sustainSummary(today: number[], previous: number, best: number): string {
  if (best <= 0) return 'First time';
  const first = today.length ? `Best today ${fmt(Math.max(...today))}` : previous ? `Last time ${fmt(previous)}` : '';
  return [first, `Best ever ${fmt(best)}`].filter(Boolean).join(' · ');
}

export interface SustainEvents {
  onRecord?: () => void;
  onUndo?: () => void;
}

export interface SustainPanel {
  /** Start a new sub-step: Undo forgets earlier holds, and a hold still running is logged but not reported. */
  resetStep(): void;
  stop(): void;
}

/** Tap-to-start, tap-to-stop stopwatch for sustained notes; each hold is logged for the day. */
export function mountSustainPanel(container: HTMLElement, events: SustainEvents = {}): SustainPanel {
  let startedAt = 0;
  let interval: ReturnType<typeof setInterval> | undefined;
  let stepHolds: string[] = [];
  let step = 0;
  let holdStep = 0;

  function draw() {
    const running = interval !== undefined;
    const today = todaySustains();
    container.innerHTML = `
      <div class="sustain-head">
        <h2>Sustain timer</h2>
        <span class="muted">${esc(sustainSummary(today, previousBest(), bestEver()))}</span>
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
      const counts = recorded && holdStep === step;
      if (counts) stepHolds.push(day);
      buzz(40);
      draw();
      // After buzz(40), so a listener's own buzz replaces the short one.
      if (counts) events.onRecord?.();
      return;
    }
    startedAt = Date.now();
    holdStep = step;
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
      step += 1;
      if (!stepHolds.length) return;
      stepHolds = [];
      draw();
    },
    stop,
  };
}
