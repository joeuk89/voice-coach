import { animationFor, mountAnimation, type AnimationPlayer } from '../animations';
import { exercises } from '../exercises';
import { esc, formatClock, on } from '../lib/dom';
import { icons } from '../lib/icons';
import { planSubSteps } from '../state/plan';
import { durationFor, loadSettings } from '../state/settings';
import type { Exercise, Settings } from '../types';
import { libraryIdFromHash, routineDurations, shareLabel } from './library/helpers';

const chevronRight = `<span class="lib-chevron">${icons.chevronLeft}</span>`;

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
          const off = settings.disabled.includes(e.id);
          const durations = routineDurations(durationFor(e, settings, 'short'), durationFor(e, settings, 'full'));
          return `<li><a class="lib-row" href="#/library/${esc(e.id)}">
            <span class="lib-row-text">
              <span class="lib-row-name">${esc(e.name)}${off ? ' <span class="lib-off">off</span>' : ''}</span>
              <span class="lib-row-purpose muted">${esc(e.purpose)}</span>
              <span class="lib-row-dur muted mono">${durations}</span>
            </span>
            ${chevronRight}
          </a></li>`;
        })
        .join('')}
    </ol>`;
}

/** The Full routine time the step shares are taken from; the default when Settings leaves the exercise out. */
function fullSeconds(exercise: Exercise, settings: Settings): number {
  return durationFor(exercise, settings, 'full') || exercise.duration.full;
}

function detailView(exercise: Exercise, settings: Settings, hasAnimation: boolean): string {
  const full = fullSeconds(exercise, settings);
  const plan = planSubSteps(exercise, full);
  const showChips = hasAnimation && plan.length > 0;
  return `
    <header>
      <a class="back-link" href="#/library">${icons.chevronLeft}Library</a>
      <h1 tabindex="-1">${esc(exercise.name)}</h1>
      <p class="muted">${esc(exercise.purpose)}</p>
    </header>

    ${hasAnimation ? '<section class="card demo" id="demo"></section>' : ''}
    ${
      exercise.kind === 'audio'
        ? `<section class="card lib-track">
            <div class="eyebrow">Track · ${formatClock(exercise.duration.full)}</div>
            <p class="muted">Plays in the Full routine.</p>
          </section>`
        : ''
    }

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
              <p id="lib-now-text"></p>
            </div>
          </div>`
        : ''
    }

    ${
      plan.length
        ? `<section class="card">
            <h2>Steps</h2>
            <p class="muted lib-note">Times are shares of the Full routine, ${formatClock(full)}.</p>
            <ol class="lib-steps">
              ${plan
                .map(
                  (p, i) => `<li>
                    <span class="lib-num mono">${i + 1}</span>
                    <span class="lib-step-text">${esc(p.subStep.text)}</span>
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
  const nowText = root.querySelector<HTMLElement>('#lib-now-text');

  on(root, '.lib-chips .win-chip', 'click', (_ev, chip) => {
    const sub = chip.dataset['sub'];
    const subStep = sub === 'all' ? undefined : exercise.subSteps[Number(sub)];
    root.querySelectorAll('.lib-chips .win-chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    player.setWindow(subStep?.window);
    now?.classList.toggle('shown', Boolean(subStep));
    if (nowStep) nowStep.textContent = subStep ? `Step ${Number(sub) + 1} of ${exercise.subSteps.length}` : '';
    if (nowText) nowText.textContent = subStep?.text ?? '';
  });

  return () => player.stop();
}
