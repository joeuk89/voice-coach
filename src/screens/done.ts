import { esc, formatClock, on } from '../lib/dom';
import { appendLog, localDay, setLatestFeeling } from '../state/log';
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
    session.logged = true;
    appendLog({
      date: localDay(),
      completedAt: new Date().toISOString(),
      routine: session.routine,
      totalSec,
    });
  }

  root.innerHTML = `
    <header class="done-head">
      <div class="eyebrow">Routine complete</div>
      <h1>Nice work.</h1>
      <p class="muted">${esc(formatClock(totalSec))} of practice.</p>
    </header>

    <section class="card">
      <h2>Voice felt</h2>
      <div class="feeling-row">
        <button class="btn feeling" data-feeling="strong">Strong</button>
        <button class="btn feeling" data-feeling="ok">OK</button>
        <button class="btn feeling" data-feeling="strained">Strained</button>
      </div>
    </section>

    <a class="btn btn-primary" href="#/" id="home">Done</a>
  `;

  on(root, '.feeling', 'click', (_ev, el) => {
    const feeling = el.dataset['feeling'] as Feeling;
    setLatestFeeling(feeling);
    root.querySelectorAll('.feeling').forEach((b) => b.classList.toggle('selected', b === el));
  });

  return () => {
    endSession();
  };
}
