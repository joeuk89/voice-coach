import { esc, formatMinutes, on, redrawKeepingFocus } from '../lib/dom';
import { initAudio } from '../lib/audio';
import { currentStreak, lastEntry, localDay, recentEntries } from '../state/log';
import { startSession } from '../state/session';
import { loadSettings, planRoutine, saveSettings, totalSeconds } from '../state/settings';
import { bindRoutineToggle, routineToggle } from '../lib/routine-toggle';
import type { Feeling, LogEntry } from '../types';

const SHORT_DATE: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };

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
  return `Last done ${d.toLocaleDateString(undefined, SHORT_DATE)}`;
}

const FEELING_NAMES: Record<Feeling, string> = { strong: 'strong', ok: 'OK', strained: 'strained' };

function feelingLabel(entry: LogEntry): string {
  const day = new Date(entry.completedAt).toLocaleDateString(undefined, SHORT_DATE);
  return `${day}: ${entry.feeling ? FEELING_NAMES[entry.feeling] : 'no note'}`;
}

export function renderHome(root: HTMLElement): () => void {
  const settings = loadSettings();
  const streak = currentStreak();
  const recent = recentEntries();

  function draw() {
    const routine = settings.routine;
    const steps = planRoutine(settings);
    root.innerHTML = `
      <header class="home-head">
        <div class="eyebrow">${esc(new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
        <h1 tabindex="-1">Voice Trainer</h1>
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
        <ol class="feelings" aria-label="How the voice felt on recent days">
          ${recent
            .map((e) => {
              const label = esc(feelingLabel(e));
              return `<li class="dot ${e.feeling ?? 'none'}" title="${label}"><span class="visually-hidden">${label}</span></li>`;
            })
            .join('')}
        </ol>
      </section>

      <a class="btn btn-ghost" href="#/settings">Settings</a>
    `;

    bindRoutineToggle(root, settings, () => {
      saveSettings(settings);
      redrawKeepingFocus(root, draw);
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
