import { exercises } from '../exercises';
import { $, closeOnBackdrop, esc, formatClock, formatMinutes, on, redrawKeepingFocus } from '../lib/dom';
import { daysFor, durationFor, isOn, loadSettings, MIN_SECONDS, repsFor, resetSettings, saveSettings, toggleDay } from '../state/settings';
import { bindRoutineToggle, routineToggle } from '../lib/routine-toggle';
import { icons } from '../lib/icons';
import { isWeekday, WEEK_ORDER, WEEKDAY_INITIALS, WEEKDAY_LONG } from '../lib/weekdays';
import type { Exercise, RepsExercise, Settings } from '../types';

const STEP_SEC = 30;
const MIN_REPS = 1;

function stepButton(dir: 'dec' | 'inc', label: string, symbol: string, e: Exercise, valueId: string, disabled = false): string {
  return `<button class="btn btn-small" data-${dir}="${e.id}" data-focus="${dir}-${e.id}" aria-label="${label}, ${esc(e.name)}" aria-describedby="${valueId}"${disabled ? ' disabled' : ''}>${symbol}</button>`;
}

function timedDetail(e: Exercise, secs: number): string {
  const id = `dur-${e.id}`;
  return `<span class="ex-time"><span class="mono" id="${id}">${formatClock(secs)}</span></span>
    <span class="stepper">${stepButton('dec', 'Shorter', '−', e, id, secs <= MIN_SECONDS)}${stepButton('inc', 'Longer', '+', e, id)}</span>`;
}

function repsDetail(e: RepsExercise, reps: number, secs: number): string {
  const id = `count-${e.id}`;
  const noun = reps === 1 ? e.repNoun : `${e.repNoun}s`;
  return `<span class="ex-time"><span id="${id}"><span class="mono">${reps}</span> ${esc(noun)}</span> <span class="muted">· about ${formatMinutes(secs)}</span></span>
    <span class="stepper">${stepButton('dec', 'Fewer', '−', e, id, reps <= MIN_REPS)}${stepButton('inc', 'More', '+', e, id)}</span>`;
}

function rowDetail(e: Exercise, settings: Settings): string {
  const secs = durationFor(e, settings);
  if (e.control === 'untimed') return `<span class="ex-time muted">About ${formatMinutes(secs)}</span>`;
  if (e.control === 'reps') return repsDetail(e, repsFor(e, settings), secs);
  return timedDetail(e, secs);
}

/** One toggle per day, Monday first. The last day left on is disabled: the switch is how an exercise leaves the routine. */
function dayChips(e: Exercise, settings: Settings): string {
  const days = daysFor(e, settings);
  const chips = WEEK_ORDER.map((d) => {
    const pressed = days.includes(d);
    const last = pressed && days.length === 1;
    return `<button type="button" class="day-chip" data-day="${d}" data-ex="${e.id}" data-focus="day-${d}-${e.id}" aria-pressed="${pressed}" aria-label="${WEEKDAY_LONG[d]}, ${esc(e.name)}"${last ? ' disabled' : ''}>${WEEKDAY_INITIALS[d]}</button>`;
  });
  return `<div class="day-chips" role="group" aria-label="Days, ${esc(e.name)}">${chips.join('')}</div>`;
}

function exerciseRow(e: Exercise, settings: Settings): string {
  const on = isOn(e, settings);
  const toggle = `<button type="button" class="switch" role="switch" aria-checked="${on}" aria-labelledby="name-${e.id}" data-toggle="${e.id}" data-focus="on-${e.id}"><span class="switch-track" aria-hidden="true"></span></button>`;
  return `<li class="ex-row${on ? '' : ' off'}">
    <div class="ex-head"><span class="ex-name" id="name-${e.id}">${esc(e.name)}</span>${toggle}</div>
    ${on ? `<div class="ex-detail">${rowDetail(e, settings)}</div>${dayChips(e, settings)}` : ''}
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
        <p class="muted settings-intro">Times, counts and days for the ${routine === 'short' ? 'Short' : 'Full'} routine. The switch turns an exercise on or off in this routine.</p>
        <ul class="ex-list">
          ${exercises.map((e) => exerciseRow(e, settings)).join('')}
        </ul>
      </section>

      <button class="btn btn-ghost" id="reset" data-focus="reset">Reset to defaults</button>

      <dialog class="confirm" id="reset-confirm" aria-labelledby="reset-title">
        <h2 id="reset-title">Reset to defaults?</h2>
        <p class="muted">Every exercise goes back to its default routines, days, time and count.</p>
        <div class="confirm-actions">
          <button class="btn btn-primary" id="reset-cancel">Cancel</button>
          <button class="btn" id="reset-yes">Reset</button>
        </div>
      </dialog>
    `;

    bindRoutineToggle(root, settings, persist);
    on(root, '[role=switch]', 'click', (_ev, el) => {
      const id = el.dataset['toggle']!;
      const off = settings.disabled[settings.routine];
      settings.disabled[settings.routine] = off.includes(id) ? off.filter((d) => d !== id) : [...off, id];
      persist();
    });
    on(root, '[data-day]', 'click', (_ev, el) => {
      const exercise = exercises.find((e) => e.id === el.dataset['ex']);
      const day = Number(el.dataset['day']);
      if (!exercise || !isWeekday(day)) return;
      toggleDay(exercise, settings, settings.routine, day);
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
      const next = Math.max(MIN_SECONDS, durationFor(exercise, settings) + direction * STEP_SEC);
      settings.durations[settings.routine][id] = next;
      atFloor = next === MIN_SECONDS;
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
