import { exercises } from '../exercises';
import { esc, formatClock, on, redrawKeepingFocus } from '../lib/dom';
import { defaultSettings, durationFor, loadSettings, saveSettings } from '../state/settings';
import { bindRoutineToggle, routineToggle } from '../lib/routine-toggle';

const STEP_SEC = 30;

export function renderSettings(root: HTMLElement): () => void {
  let settings = loadSettings();

  function draw() {
    const routine = settings.routine;
    root.innerHTML = `
      <header>
        <a class="back-link" href="#/"><span aria-hidden="true">‹</span> Home</a>
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
              const name = esc(e.name);
              const step = (dir: 'dec' | 'inc', label: string, symbol: string) =>
                `<button class="btn btn-small" data-${dir}="${e.id}" data-focus="${dir}-${e.id}" ${fixed ? 'disabled' : ''} aria-label="${label}, ${name}" aria-describedby="dur-${e.id}">${symbol}</button>`;
              return `<li class="${enabled ? '' : 'off'}">
                <label class="ex-name"><input type="checkbox" data-id="${e.id}" data-focus="on-${e.id}" ${enabled ? 'checked' : ''}> ${name}</label>
                <div class="stepper">
                  ${step('dec', 'Shorter', '−')}
                  <span class="mono" id="dur-${e.id}">${formatClock(secs)}</span>
                  ${step('inc', 'Longer', '+')}
                </div>
              </li>`;
            })
            .join('')}
        </ul>
      </section>

      <button class="btn btn-ghost" id="reset" data-focus="reset">Reset to defaults</button>
    `;

    bindRoutineToggle(root, settings, persist);
    on(root, 'input[type=checkbox]', 'change', (_ev, el) => {
      const id = (el as HTMLInputElement).dataset['id']!;
      settings.disabled = (el as HTMLInputElement).checked ? settings.disabled.filter((d) => d !== id) : [...settings.disabled, id];
      persist();
    });
    on(root, '[data-dec]', 'click', (_ev, el) => adjust(el.dataset['dec']!, -STEP_SEC));
    on(root, '[data-inc]', 'click', (_ev, el) => adjust(el.dataset['inc']!, STEP_SEC));
    on(root, '#reset', 'click', () => {
      settings = defaultSettings();
      persist();
    });
  }

  function adjust(id: string, delta: number) {
    const exercise = exercises.find((e) => e.id === id);
    if (!exercise) return;
    const next = Math.max(0, durationFor(exercise, settings) + delta);
    settings.durations[settings.routine][id] = next;
    persist();
  }

  function persist() {
    saveSettings(settings);
    redrawKeepingFocus(root, draw);
  }

  draw();
  return () => undefined;
}
