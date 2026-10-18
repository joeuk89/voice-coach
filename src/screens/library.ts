import { animationFor, mountAnimation, type AnimationPlayer } from '../animations';
import { exercises } from '../exercises';
import { esc, formatClock, on } from '../lib/dom';
import { exampleChips } from '../lib/example-chips';
import { icons } from '../lib/icons';
import { planSubSteps } from '../state/plan';
import { daysFor, durationFor, isOn, loadSettings, repsFor } from '../state/settings';
import type { Exercise, RoutineId, Settings } from '../types';
import { libraryIdFromHash, routineDurations, scheduleSentence, shareLabel, type RoutineSlot, type RoutineSlots } from './library/helpers';

const chevronRight = `<span class="lib-chevron">${icons.chevronLeft}</span>`;

function slotIfOn(exercise: Exercise, settings: Settings, routine: RoutineId): RoutineSlot | undefined {
  if (!isOn(exercise, settings, routine)) return undefined;
  return { seconds: durationFor(exercise, settings, routine), days: daysFor(exercise, settings, routine) };
}

function slots(exercise: Exercise, settings: Settings): RoutineSlots {
  return { short: slotIfOn(exercise, settings, 'short'), full: slotIfOn(exercise, settings, 'full') };
}

function listView(settings: Settings): string {
  return `
    <header>
      <a class="back-link" href="#/">${icons.chevronLeft}Home</a>
      <div class="eyebrow">${exercises.length} exercises</div>
      <h1 tabindex="-1">Library</h1>
    </header>

    <ol class="card lib-list">
      ${exercises
        .map((e) => {
          const durations = routineDurations(slots(e, settings));
          return `<li><a class="lib-row" href="#/library/${esc(e.id)}">
            <span class="lib-row-text">
              <span class="lib-row-name">${esc(e.name)}</span>
              <span class="lib-row-purpose muted">${esc(e.purpose)}</span>
              <span class="lib-row-dur muted mono">${durations}</span>
            </span>
            ${chevronRight}
          </a></li>`;
        })
        .join('')}
    </ol>`;
}

function detailView(exercise: Exercise, settings: Settings, hasAnimation: boolean): string {
  const full = durationFor(exercise, settings, 'full');
  const plan = planSubSteps(exercise, full, repsFor(exercise, settings, 'full'));
  const showChips = hasAnimation && plan.length > 0;
  const schedule = scheduleSentence(slots(exercise, settings));
  return `
    <header>
      <a class="back-link" href="#/library">${icons.chevronLeft}Library</a>
      <h1 tabindex="-1">${esc(exercise.name)}</h1>
      <p class="muted">${esc(exercise.purpose)}</p>
      ${schedule ? `<p class="muted lib-days">${esc(schedule)}</p>` : ''}
    </header>

    ${hasAnimation ? '<section class="card demo" id="demo"></section>' : ''}

    ${
      showChips
        ? `<div class="lib-loop">
            <div class="win-chips lib-chips" role="group" aria-label="Loop one step">
              ${plan
                .map((_p, i) => `<button class="win-chip" data-sub="${i}" aria-pressed="false" aria-label="Step ${i + 1}">${i + 1}</button>`)
                .join('')}
              <button class="win-chip" data-sub="all" aria-pressed="true">Whole loop</button>
            </div>
            <div class="lib-now" aria-live="polite">
              <div class="eyebrow" id="lib-now-step"></div>
            </div>
          </div>`
        : ''
    }

    ${
      plan.length
        ? `<section class="card">
            <h2>Steps</h2>
            ${plan.some((p) => p.mode === 'timed') ? `<p class="muted lib-note">Times are shares of the Full routine, ${formatClock(full)}.</p>` : ''}
            <ol class="lib-steps">
              ${plan
                .map(
                  (p, i) => `<li>
                    <span class="lib-num mono">${i + 1}</span>
                    <div class="lib-step-text">${esc(p.subStep.text)}${exampleChips(p.subStep.examples)}</div>
                    <span class="muted mono">${shareLabel(p)}</span>
                  </li>`,
                )
                .join('')}
            </ol>
          </section>`
        : ''
    }

    ${
      exercise.tips?.length
        ? `<section class="card">
            <h2>Tips</h2>
            <ul class="lib-bullets">${exercise.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          </section>`
        : ''
    }

    ${
      exercise.links.length
        ? `<section class="card">
            <h2>Sources</h2>
            <ul class="lib-links">${exercise.links
              .map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`)
              .join('')}</ul>
          </section>`
        : ''
    }

    <a class="btn" href="#/library">Back to Library</a>`;
}

export function renderLibrary(root: HTMLElement): () => void {
  const settings = loadSettings();
  const id = libraryIdFromHash(location.hash);
  const exercise = exercises.find((e) => e.id === id);

  if (!exercise) {
    if (location.hash !== '#/library') history.replaceState(null, '', '#/library');
    root.innerHTML = listView(settings);
    return () => undefined;
  }

  const def = animationFor(exercise.animation);
  root.innerHTML = detailView(exercise, settings, Boolean(def));
  if (!def) return () => undefined;

  const player: AnimationPlayer = mountAnimation(root.querySelector<HTMLElement>('#demo')!, def, { caption: true });
  const now = root.querySelector<HTMLElement>('.lib-now');
  const nowStep = root.querySelector<HTMLElement>('#lib-now-step');

  on(root, '.lib-chips .win-chip', 'click', (_ev, chip) => {
    const sub = chip.dataset['sub'];
    const subStep = sub === 'all' ? undefined : exercise.subSteps[Number(sub)];
    root.querySelectorAll('.lib-chips .win-chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    player.setWindow(subStep?.window);
    now?.classList.toggle('shown', Boolean(subStep));
    if (nowStep) nowStep.textContent = subStep ? `Step ${Number(sub) + 1} of ${exercise.subSteps.length}` : '';
  });

  return () => player.stop();
}
