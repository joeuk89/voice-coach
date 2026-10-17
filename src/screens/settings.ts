import { exercises } from '../exercises';
import { $, closeOnBackdrop, esc, formatClock, on, redrawKeepingFocus } from '../lib/dom';
import { defaultSettings, durationFor, loadSettings, saveSettings } from '../state/settings';
import { bindRoutineToggle, routineToggle } from '../lib/routine-toggle';
import { icons } from '../lib/icons';
import type { Exercise, Settings } from '../types';

const STEP_SEC = 30;

function exerciseRow(e: Exercise, settings: Settings): string {
  const enabled = !settings.disabled.includes(e.id);
  const secs = durationFor(e, settings);
  const fixed = e.kind === 'audio';
  const name = esc(e.name);
  const toggle = `<button type="button" class="switch" role="switch" aria-checked="${enabled}" aria-labelledby="name-${e.id}" data-toggle="${e.id}" data-focus="on-${e.id}"><span class="switch-track" aria-hidden="true"></span></button>`;
  let detail = '';
  if (enabled && fixed) {
    detail = `<span class="ex-time muted">${settings.routine === 'short' ? 'Full only' : `Fixed track · ${formatClock(secs)}`}</span>`;
  } else if (enabled) {
    const step = (dir: 'dec' | 'inc', label: string, symbol: string) =>
      `<button class="btn btn-small" data-${dir}="${e.id}" data-focus="${dir}-${e.id}" aria-label="${label}, ${name}" aria-describedby="dur-${e.id}">${symbol}</button>`;
    detail =
      secs === 0
        ? `<span class="ex-time muted"><span class="mono" id="dur-${e.id}">0:00</span> · Not in this routine</span>
          <span class="stepper">${step('inc', 'Longer', '+')}</span>`
        : `<span class="ex-time"><span class="mono" id="dur-${e.id}">${formatClock(secs)}</span></span>
          <span class="stepper">${step('dec', 'Shorter', '−')}${step('inc', 'Longer', '+')}</span>`;
  }
  const off = !enabled || secs === 0;
  return `<li class="ex-row${off ? ' off' : ''}">
    <div class="ex-head"><span class="ex-name" id="name-${e.id}">${name}</span>${toggle}</div>
    ${detail ? `<div class="ex-detail">${detail}</div>` : ''}
  </li>`;
}

export function renderSettings(root: HTMLElement): () => void {
  let settings = loadSettings();

  function draw() {
    const routine = settings.routine;
    root.innerHTML = `
      <header>
        <a class="back-link" href="#/">${icons.chevronLeft}Home</a>
        <h1 tabindex="-1">Settings</h1>
      </header>

      <section class="card">
        <h2>Routine</h2>
        ${routineToggle(settings, 'Routine')}
      </section>

      <section class="card">
        <h2>Exercises</h2>
        <p class="muted settings-intro">Times for the ${routine === 'short' ? 'Short' : 'Full'} routine. Set 0:00 to skip an exercise here only.</p>
        <ul class="ex-list">
          ${exercises.map((e) => exerciseRow(e, settings)).join('')}
        </ul>
      </section>

      <button class="btn btn-ghost" id="reset" data-focus="reset">Reset to defaults</button>

      <dialog class="confirm" id="reset-confirm" aria-labelledby="reset-title">
        <h2 id="reset-title">Reset durations and exercises?</h2>
        <p class="muted">Every exercise goes back on, at its default time.</p>
        <div class="confirm-actions">
          <button class="btn btn-primary" id="reset-cancel">Cancel</button>
          <button class="btn" id="reset-yes">Reset</button>
        </div>
      </dialog>
    `;

    bindRoutineToggle(root, settings, persist);
    on(root, '[role=switch]', 'click', (_ev, el) => {
      const id = el.dataset['toggle']!;
      const enabled = !settings.disabled.includes(id);
      settings.disabled = enabled ? [...settings.disabled, id] : settings.disabled.filter((d) => d !== id);
      persist();
    });
    on(root, '[data-dec]', 'click', (_ev, el) => adjust(el.dataset['dec']!, -STEP_SEC));
    on(root, '[data-inc]', 'click', (_ev, el) => adjust(el.dataset['inc']!, STEP_SEC));
    const confirm = $<HTMLDialogElement>(root, '#reset-confirm');
    on(root, '#reset', 'click', () => confirm.showModal());
    on(root, '#reset-cancel', 'click', () => confirm.close());
    on(root, '#reset-yes', 'click', () => {
      confirm.close();
      settings = { ...defaultSettings(), routine: settings.routine };
      persist();
    });
    closeOnBackdrop(confirm);
  }

  function adjust(id: string, delta: number) {
    const exercise = exercises.find((e) => e.id === id);
    if (!exercise) return;
    const next = Math.max(0, durationFor(exercise, settings) + delta);
    settings.durations[settings.routine][id] = next;
    if (next === 0) root.querySelector<HTMLElement>(`[data-inc="${id}"]`)?.focus({ preventScroll: true });
    persist();
  }

  function persist() {
    saveSettings(settings);
    redrawKeepingFocus(root, draw);
  }

  draw();
  return () => undefined;
}
