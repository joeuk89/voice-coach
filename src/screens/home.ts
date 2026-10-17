import { esc, formatMinutes, on } from '../lib/dom';
import { initAudio } from '../lib/audio';
import { currentStreak, lastEntry, localDay, recentFeelings } from '../state/log';
import { startSession } from '../state/session';
import { loadSettings, planRoutine, saveSettings, totalSeconds } from '../state/settings';
import { routineToggle } from '../lib/routine-toggle';
import type { RoutineId } from '../types';

function lastDoneLabel(): string {
  const last = lastEntry();
  if (!last) return 'Not done yet';
  const today = localDay();
  const dayBefore = new Date();
  dayBefore.setDate(dayBefore.getDate() - 1);
  const yesterday = localDay(dayBefore);
  if (last.date === today) return 'Done today';
  if (last.date === yesterday) return 'Last done yesterday';
  const d = new Date(last.completedAt);
  return `Last done ${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}`;
}

export function renderHome(root: HTMLElement): () => void {
  const settings = loadSettings();
  const streak = currentStreak();
  const feelings = recentFeelings();

  function draw() {
    const routine = settings.routine;
    const steps = planRoutine(settings);
    root.innerHTML = `
      <header class="home-head">
        <div class="eyebrow">${esc(new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
        <h1>Voice Trainer</h1>
      </header>

      ${routineToggle(settings, 'Routine')}

      <section class="card routine">
        <div class="routine-title">
          <span>${routine === 'short' ? 'Short' : 'Full'} routine</span>
          <span class="muted">${steps.length} exercises · ${formatMinutes(totalSeconds(settings))}</span>
        </div>
        <ol class="routine-list">
          ${steps.map((s) => `<li><span>${esc(s.exercise.name)}</span><span class="muted">${formatMinutes(s.seconds)}</span></li>`).join('')}
        </ol>
      </section>

      <button class="btn btn-primary btn-start" id="start" ${steps.length === 0 ? 'disabled' : ''}>Start</button>

      <section class="streak">
        <div><strong>${streak}</strong> day streak</div>
        <div class="muted">${esc(lastDoneLabel())}</div>
        <div class="feelings" aria-label="How the voice felt on recent days">
          ${feelings.map((f) => `<i class="dot ${f ?? 'none'}" title="${f ?? 'no note'}"></i>`).join('')}
        </div>
      </section>

      <a class="btn btn-ghost" href="#/settings">Settings</a>
    `;

    on(root, '.seg', 'click', (_ev, el) => {
      settings.routine = el.dataset['routine'] as RoutineId;
      saveSettings(settings);
      draw();
    });
    on(root, '#start', 'click', () => {
      initAudio();
      startSession(routine, steps);
      location.hash = '#/go';
    });
  }

  draw();
  return () => undefined;
}
