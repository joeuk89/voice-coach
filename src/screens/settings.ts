import { exercises } from '../exercises';
import { esc, formatClock, on } from '../lib/dom';
import { defaultSettings, durationFor, loadSettings, saveSettings } from '../state/settings';
import { routineToggle } from '../lib/routine-toggle';
import type { RoutineId } from '../types';

const STEP_SEC = 30;

export function renderSettings(root: HTMLElement): () => void {
  let settings = loadSettings();

  function draw() {
    const routine = settings.routine;
    root.innerHTML = `
      <header>
        <a class="back-link" href="#/">‹ Home</a>
        <h1>Settings</h1>
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
              return `<li class="${enabled ? '' : 'off'}">
                <label class="ex-name"><input type="checkbox" data-id="${e.id}" ${enabled ? 'checked' : ''}> ${esc(e.name)}</label>
                <div class="stepper">
                  <button class="btn btn-small" data-dec="${e.id}" ${fixed ? 'disabled' : ''} aria-label="Shorter">−</button>
                  <span class="mono">${formatClock(secs)}</span>
                  <button class="btn btn-small" data-inc="${e.id}" ${fixed ? 'disabled' : ''} aria-label="Longer">+</button>
                </div>
              </li>`;
            })
            .join('')}
        </ul>
      </section>

      <button class="btn btn-ghost" id="reset">Reset to defaults</button>
    `;

    on(root, '.seg', 'click', (_ev, el) => {
      settings.routine = el.dataset['routine'] as RoutineId;
      persist();
    });
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
    draw();
  }

  draw();
  return () => undefined;
}
