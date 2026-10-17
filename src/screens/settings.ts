import { exercises } from '../exercises';
import { $, closeOnBackdrop, esc, formatClock, on, redrawKeepingFocus } from '../lib/dom';
import { defaultSettings, durationFor, loadSettings, saveSettings } from '../state/settings';
import { bindRoutineToggle, routineToggle } from '../lib/routine-toggle';
import { icons } from '../lib/icons';

const STEP_SEC = 30;

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
        <p class="muted">Durations below apply to the ${routine} routine. Set one to 0:00 to leave it out of this routine only.</p>
        <ul class="ex-list">
          ${exercises
            .map((e) => {
              const enabled = !settings.disabled.includes(e.id);
              const secs = durationFor(e, settings);
              const fixed = e.kind === 'audio';
              const note = fixed && routine === 'short' ? 'Full only' : secs === 0 ? 'Not in this routine' : '';
              const name = esc(e.name);
              const step = (dir: 'dec' | 'inc', label: string, symbol: string, disabled: boolean) =>
                `<button class="btn btn-small" data-${dir}="${e.id}" data-focus="${dir}-${e.id}" ${disabled ? 'disabled' : ''} aria-label="${label}, ${name}" aria-describedby="dur-${e.id}">${symbol}</button>`;
              return `<li class="${enabled && secs > 0 ? '' : 'off'}">
                <label class="ex-name">
                  <input type="checkbox" data-id="${e.id}" data-focus="on-${e.id}" ${enabled ? 'checked' : ''}>
                  <span class="ex-text">${name}${note ? `<small class="muted">${note}</small>` : ''}</span>
                </label>
                <div class="stepper">
                  ${step('dec', 'Shorter', '−', fixed || secs === 0)}
                  <span class="mono" id="dur-${e.id}">${formatClock(secs)}</span>
                  ${step('inc', 'Longer', '+', fixed)}
                </div>
              </li>`;
            })
            .join('')}
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
    on(root, 'input[type=checkbox]', 'change', (_ev, el) => {
      const id = (el as HTMLInputElement).dataset['id']!;
      settings.disabled = (el as HTMLInputElement).checked ? settings.disabled.filter((d) => d !== id) : [...settings.disabled, id];
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
