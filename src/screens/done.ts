import { esc, formatPractice, on } from '../lib/dom';
import { dayStrip } from '../lib/day-strip';
import { appendLog, loadLog, localDay, setFeeling, streakWithToday } from '../state/log';
import { endSession, getSession } from '../state/session';
import type { Feeling } from '../types';

const CHECK_RING = `<svg class="check-ring" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
  <circle class="check-ring-track" cx="32" cy="32" r="29"/>
  <circle class="check-ring-circle" cx="32" cy="32" r="29" pathLength="1" transform="rotate(-90 32 32)"/>
  <path class="check-ring-tick" d="m20 33 8 8 16-17" pathLength="1"/>
</svg>`;

const FEELINGS: { id: Feeling; label: string }[] = [
  { id: 'strong', label: 'Strong' },
  { id: 'ok', label: 'OK' },
  { id: 'strained', label: 'Strained' },
];

export function renderDone(root: HTMLElement): () => void {
  const session = getSession();
  if (!session) {
    location.replace('#/');
    return () => undefined;
  }

  const totalSec = Math.round((Date.now() - session.startedAt) / 1000);
  const steps = session.steps.length;
  if (!session.logged) {
    const completedAt = new Date().toISOString();
    const saved = appendLog({ date: localDay(), completedAt, routine: session.routine, totalSec, steps });
    session.logged = { completedAt, saved };
  }
  const { completedAt, saved } = session.logged;

  root.innerHTML = `
    <header class="done-head">
      ${CHECK_RING}
      <h1 tabindex="-1">${saved ? `Day ${streakWithToday()} done` : 'Not saved on this phone'}</h1>
      <p class="muted">${esc(formatPractice(totalSec))} · ${steps} ${steps === 1 ? 'exercise' : 'exercises'}</p>
    </header>

    <section class="card done-week">${dayStrip(loadLog())}</section>

    <section class="card">
      ${
        saved
          ? `<h2 id="feeling-title">How did your voice feel?</h2>
            <div class="feeling-row" role="group" aria-labelledby="feeling-title">
              ${FEELINGS.map((f) => `<button class="btn feeling" data-feeling="${f.id}" aria-pressed="false"><span class="feeling-dot" aria-hidden="true"></span>${f.label}</button>`).join('')}
            </div>`
          : '<p class="muted">The phone would not save this routine, so the feeling cannot be noted.</p>'
      }
    </section>

    <a class="btn btn-primary" href="#/" id="home">Done</a>
  `;

  on(root, '.feeling', 'click', (_ev, el) => {
    const feeling = el.dataset['feeling'] as Feeling;
    if (!setFeeling(completedAt, feeling)) return;
    root.querySelectorAll('.feeling').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
    root.querySelector('.done-week')!.innerHTML = dayStrip(loadLog());
  });

  return () => {
    endSession();
  };
}
