import { exercises } from '../exercises';
import { $, closeOnBackdrop, esc, formatClock, formatMinutes, on, redrawKeepingFocus } from '../lib/dom';
import { durationFor, loadSettings, repsFor, resetSettings, saveSettings } from '../state/settings';
import { bindRoutineToggle, routineToggle } from '../lib/routine-toggle';
import { icons } from '../lib/icons';
import type { Exercise, RepsExercise, Settings } from '../types';

const STEP_SEC = 30;
const MIN_REPS = 1;

function stepButton(dir: 'dec' | 'inc', label: string, symbol: string, e: Exercise, valueId: string, disabled = false): string {
  return `<button class="btn btn-small" data-${dir}="${e.id}" data-focus="${dir}-${e.id}" aria-label="${label}, ${esc(e.name)}" aria-describedby="${valueId}"${disabled ? ' disabled' : ''}>${symbol}</button>`;
}

function notInRoutine(e: Exercise, settings: Settings): string {
  const other = settings.routine === 'short' ? 'full' : 'short';
  if (durationFor(e, settings, other) === 0) return 'Not in a routine';
  return other === 'full' ? 'Full only' : 'Short only';
}

function timedDetail(e: Exercise, secs: number): string {
  const id = `dur-${e.id}`;
  return secs === 0
    ? `<span class="ex-time muted"><span class="mono" id="${id}">0:00</span> · Not in this routine</span>
      <span class="stepper">${stepButton('inc', 'Longer', '+', e, id)}</span>`
    : `<span class="ex-time"><span class="mono" id="${id}">${formatClock(secs)}</span></span>
      <span class="stepper">${stepButton('dec', 'Shorter', '−', e, id)}${stepButton('inc', 'Longer', '+', e, id)}</span>`;
}

function repsDetail(e: RepsExercise, reps: number, secs: number): string {
  const id = `count-${e.id}`;
  const noun = reps === 1 ? e.repNoun : `${e.repNoun}s`;
  return `<span class="ex-time"><span id="${id}"><span class="mono">${reps}</span> ${esc(noun)}</span>${
    secs > 0 ? ` <span class="muted">· about ${formatMinutes(secs)}</span>` : ''
  }</span>
    <span class="stepper">${stepButton('dec', 'Fewer', '−', e, id, reps <= MIN_REPS)}${stepButton('inc', 'More', '+', e, id)}</span>`;
}

function rowDetail(e: Exercise, settings: Settings, secs: number): string {
  if (e.kind === 'audio') {
    return `<span class="ex-time muted">${secs === 0 ? notInRoutine(e, settings) : `Fixed track · ${formatClock(secs)}`}</span>`;
  }
  if (e.control === 'untimed') {
    return `<span class="ex-time muted">${secs === 0 ? notInRoutine(e, settings) : `About ${formatMinutes(secs)}`}</span>`;
  }
  if (e.control === 'reps') return repsDetail(e, repsFor(e, settings), secs);
  return timedDetail(e, secs);
}

function exerciseRow(e: Exercise, settings: Settings): string {
  const enabled = !settings.disabled.includes(e.id);
  const secs = durationFor(e, settings);
  const cannotAddBack = secs === 0 && (e.kind === 'audio' || e.control === 'untimed');
  const toggle = `<button type="button" class="switch" role="switch" aria-checked="${enabled}" aria-labelledby="name-${e.id}" data-toggle="${e.id}" data-focus="on-${e.id}"${cannotAddBack ? ' disabled' : ''}><span class="switch-track" aria-hidden="true"></span></button>`;
  const off = !enabled || secs === 0;
  return `<li class="ex-row${off ? ' off' : ''}">
    <div class="ex-head"><span class="ex-name" id="name-${e.id}">${esc(e.name)}</span>${toggle}</div>
    ${enabled || cannotAddBack ? `<div class="ex-detail">${rowDetail(e, settings, secs)}</div>` : ''}
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
        <p class="muted settings-intro">Times and counts for the ${routine === 'short' ? 'Short' : 'Full'} routine. The switch turns an exercise off in both routines. A time of 0:00 leaves it out of this one only.</p>
        <ul class="ex-list">
          ${exercises.map((e) => exerciseRow(e, settings)).join('')}
        </ul>
      </section>

      <button class="btn btn-ghost" id="reset" data-focus="reset">Reset to defaults</button>

      <dialog class="confirm" id="reset-confirm" aria-labelledby="reset-title">
        <h2 id="reset-title">Reset to defaults?</h2>
        <p class="muted">Every exercise goes back on, with its default time or count.</p>
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
    on(root, '[data-dec]', 'click', (_ev, el) => adjust(el.dataset['dec']!, -1));
    on(root, '[data-inc]', 'click', (_ev, el) => adjust(el.dataset['inc']!, 1));
    const confirm = $<HTMLDialogElement>(root, '#reset-confirm');
    on(root, '#reset', 'click', () => confirm.showModal());
    on(root, '#reset-cancel', 'click', () => confirm.close());
    on(root, '#reset-yes', 'click', () => {
      confirm.close();
      settings = resetSettings(settings);
      persist();
    });
    closeOnBackdrop(confirm);
  }

  function adjust(id: string, direction: 1 | -1) {
    const exercise = exercises.find((e) => e.id === id);
    if (!exercise || exercise.control === 'untimed') return;
    let atFloor: boolean;
    if (exercise.control === 'reps') {
      const next = Math.max(MIN_REPS, repsFor(exercise, settings) + direction);
      settings.reps[settings.routine][id] = next;
      atFloor = next === MIN_REPS;
    } else {
      const next = Math.max(0, durationFor(exercise, settings) + direction * STEP_SEC);
      settings.durations[settings.routine][id] = next;
      atFloor = next === 0;
    }
    if (atFloor) root.querySelector<HTMLElement>(`[data-inc="${id}"]`)?.focus({ preventScroll: true });
    persist();
  }

  function persist() {
    saveSettings(settings);
    redrawKeepingFocus(root, draw);
  }

  draw();
  return () => undefined;
}
