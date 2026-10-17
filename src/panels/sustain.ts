import { $, esc } from '../lib/dom';
import { buzz } from '../lib/haptics';
import { bestEver, previousBest, recordSustain, removeLastSustain, todaySustains } from '../state/sustains';

function fmt(sec: number): string {
  return `${sec.toFixed(1)} s`;
}

/** Tap-to-start, tap-to-stop stopwatch for sustained notes; each hold is logged for the day. */
export function mountSustainPanel(container: HTMLElement): () => void {
  let startedAt = 0;
  let interval: ReturnType<typeof setInterval> | undefined;

  function draw() {
    const today = todaySustains();
    const best = bestEver();
    const prev = previousBest();
    container.innerHTML = `
      <div class="sustain-head">
        <h2>Sustain timer</h2>
        <span class="muted">${prev ? `Last time ${esc(fmt(prev))}` : 'First time'}${best ? ` · Best ${esc(fmt(best))}` : ''}</span>
      </div>
      <div class="sustain-row">
        <div class="sustain-clock mono" id="sustain-clock">0.0 s</div>
        <button class="btn btn-primary sustain-btn" id="sustain-toggle">Start hold</button>
      </div>
      <div class="sustain-today">
        ${
          today.length
            ? `<span class="muted">Today:</span> ${today.map((s) => `<span class="chip mono">${esc(fmt(s))}</span>`).join('')}
               <button class="btn btn-ghost btn-small" id="sustain-undo" aria-label="Remove last">Undo</button>`
            : '<span class="muted">Tap Start when the note begins, Stop when it ends.</span>'
        }
      </div>`;

    $(container, '#sustain-toggle').addEventListener('click', toggle);
    container.querySelector('#sustain-undo')?.addEventListener('click', () => {
      removeLastSustain();
      draw();
    });
  }

  function toggle() {
    if (interval) {
      const held = (Date.now() - startedAt) / 1000;
      stop();
      if (held >= 0.5) recordSustain(held);
      buzz(40);
      draw();
      return;
    }
    startedAt = Date.now();
    const clock = $(container, '#sustain-clock');
    const button = $(container, '#sustain-toggle');
    button.textContent = 'Stop';
    button.classList.add('running');
    interval = setInterval(() => {
      clock.textContent = fmt((Date.now() - startedAt) / 1000);
    }, 100);
  }

  function stop() {
    if (interval) clearInterval(interval);
    interval = undefined;
  }

  draw();
  return stop;
}
