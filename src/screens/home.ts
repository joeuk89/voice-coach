import { $, closeOnBackdrop, esc, formatClock, formatMinutes, formatPractice, on, redrawKeepingFocus } from '../lib/dom';
import { initAudio } from '../lib/audio';
import { exercises } from '../exercises';
import { currentStreak, lastEntry, loadLog, localDay, parseDay, todayEntry } from '../state/log';
import { markOnboarded, needsOnboarding } from '../state/onboarding';
import { startSession } from '../state/session';
import { durationFor, loadSettings, planRoutine, saveSettings, totalSeconds } from '../state/settings';
import { bindRoutineToggle, routineToggle } from '../lib/routine-toggle';
import { dayStrip } from '../lib/day-strip';
import { icons } from '../lib/icons';
import type { Feeling, LogEntry, Settings } from '../types';

const SHORT_DATE: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
const FEELING_NAMES: Record<Feeling, string> = { strong: 'strong', ok: 'OK', strained: 'strained' };

function dayLabel(date: string): string {
  return parseDay(date)?.toLocaleDateString(undefined, SHORT_DATE) ?? date;
}

function lastDoneLabel(): string {
  const last = lastEntry();
  if (!last) return 'Not done yet';
  const today = localDay();
  const dayBefore = new Date();
  dayBefore.setDate(dayBefore.getDate() - 1);
  const yesterday = localDay(dayBefore);
  if (last.date === today) return 'Done today';
  if (last.date === yesterday) return 'Last done yesterday';
  return `Last done ${dayLabel(last.date)}`;
}

function exerciseCount(n: number): string {
  return `${n} ${n === 1 ? 'exercise' : 'exercises'}`;
}

function streakLine(streak: number, hasLog: boolean): string {
  if (!hasLog) return 'Your first day starts here';
  return streak ? `<strong>${streak}</strong> day streak` : 'Start a new streak today';
}

function emptyRoutineHint(settings: Settings): string {
  const canTurnOn = exercises.some((e) => settings.disabled.includes(e.id) && durationFor(e, settings) > 0);
  return canTurnOn
    ? 'All exercises are off. Turn some on in Settings.'
    : 'Every exercise is at 0:00 in this routine. Give some time in Settings.';
}

function doneTodayCard(entry: LogEntry, log: LogEntry[]): string {
  const facts = [formatPractice(entry.totalSec), ...(entry.steps ? [exerciseCount(entry.steps)] : [])].join(' · ');
  const feeling = log.filter((e) => e.date === entry.date && e.feeling).at(-1)?.feeling;
  return `<section class="card done-today">
    <span class="done-today-mark">${icons.check}</span>
    <div>
      <h2>Done today</h2>
      <p class="muted">${esc(facts)}</p>
      ${feeling ? `<p class="done-today-feeling ${feeling}">Voice felt ${FEELING_NAMES[feeling]}</p>` : ''}
    </div>
  </section>`;
}

const WELCOME = `
  <dialog class="sheet welcome" id="welcome" aria-labelledby="welcome-title">
    <h2 id="welcome-title">One step at a time</h2>
    <p class="muted">Nothing moves on by itself: tap Start when you're ready and Next when you're done. Note how your voice felt at the end.</p>
    <button class="btn btn-primary" id="welcome-ok">Got it</button>
  </dialog>`;

export function renderHome(root: HTMLElement): () => void {
  const settings = loadSettings();
  const streak = currentStreak();
  const log = loadLog();
  const doneToday = todayEntry();

  function draw() {
    const routine = settings.routine;
    const steps = planRoutine(settings);
    root.innerHTML = `
      <header class="home-head">
        <div>
          <div class="eyebrow">${esc(new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
          <h1 tabindex="-1">Voice Trainer</h1>
        </div>
        <a class="icon-link" href="#/settings" aria-label="Settings">${icons.gear}</a>
      </header>

      ${doneToday ? doneTodayCard(doneToday, log) : ''}

      ${routineToggle(settings, 'Routine')}

      <section class="card routine">
        <h2 class="routine-title">${doneToday ? 'Next time' : 'Today'} · ${exerciseCount(steps.length)} · ${formatMinutes(totalSeconds(settings))}</h2>
        ${
          steps.length
            ? `<ol class="routine-list">
                ${steps.map((s) => `<li><span>${esc(s.exercise.name)}</span><span class="muted mono">${formatClock(s.seconds)}</span></li>`).join('')}
              </ol>`
            : `<p class="muted routine-empty">${emptyRoutineHint(settings)}</p>`
        }
      </section>

      <button class="btn ${doneToday ? '' : 'btn-primary btn-start'}" id="start" ${steps.length === 0 ? 'disabled' : ''}>${doneToday ? 'Go again' : 'Start'}</button>

      <section class="streak">
        <div class="streak-count">${streakLine(streak, log.length > 0)}</div>
        ${doneToday ? '' : `<div class="muted">${esc(lastDoneLabel())}</div>`}
        ${dayStrip(log)}
      </section>
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
  if (needsOnboarding()) showWelcome(root);
  return () => undefined;
}

function showWelcome(root: HTMLElement) {
  root.insertAdjacentHTML('beforeend', WELCOME);
  const sheet = $<HTMLDialogElement>(root, '#welcome');
  sheet.addEventListener('close', () => {
    markOnboarded();
    root.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  });
  on(root, '#welcome-ok', 'click', () => sheet.close());
  closeOnBackdrop(sheet);
  sheet.showModal();
}
