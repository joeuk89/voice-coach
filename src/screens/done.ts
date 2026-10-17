import { esc, formatDuration, on } from '../lib/dom';
import { appendLog, localDay, setFeeling } from '../state/log';
import { endSession, getSession } from '../state/session';
import type { Feeling } from '../types';

export function renderDone(root: HTMLElement): () => void {
  const session = getSession();
  if (!session) {
    location.replace('#/');
    return () => undefined;
  }

  const totalSec = Math.round((Date.now() - session.startedAt) / 1000);
  if (!session.logged) {
    const completedAt = new Date().toISOString();
    const saved = appendLog({ date: localDay(), completedAt, routine: session.routine, totalSec });
    session.logged = { completedAt, saved };
  }
  const { completedAt, saved } = session.logged;

  root.innerHTML = `
    <header class="done-head">
      <div class="eyebrow">Routine complete</div>
      <h1 tabindex="-1">Nice work.</h1>
      <p class="muted">${esc(formatDuration(totalSec))} of practice.</p>
    </header>

    <section class="card">
      <h2 id="feeling-title">Voice felt</h2>
      ${
        saved
          ? `<div class="feeling-row" role="group" aria-labelledby="feeling-title">
              <button class="btn feeling" data-feeling="strong" aria-pressed="false">Strong</button>
              <button class="btn feeling" data-feeling="ok" aria-pressed="false">OK</button>
              <button class="btn feeling" data-feeling="strained" aria-pressed="false">Strained</button>
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
  });

  return () => {
    endSession();
  };
}
