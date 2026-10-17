import { esc, formatClock } from '../../lib/dom';
import { icons } from '../../lib/icons';
import type { PlannedSubStep } from '../../state/plan';
import type { Step } from '../../state/session';
import type { Exercise } from '../../types';

function rowCheck(label: string): string {
  return `<span class="row-check">${icons.check}<span class="visually-hidden">${label}</span></span>`;
}

function rowLead(number: string): string {
  return `<span class="row-lead"><span class="row-num">${number}</span>${rowCheck('Done:')}</span>`;
}

function listValue(planned: PlannedSubStep): string {
  if (planned.mode === 'untimed') return '';
  if (planned.mode === 'reps') return `× ${planned.reps}`;
  return formatClock(planned.seconds);
}

export function stepHeader(steps: readonly Step[], index: number): string {
  const position = `${index + 1} of ${steps.length}`;
  return `
    <header class="step-head">
      <div class="step-top">
        <a class="back-link" href="#/" id="home">${icons.chevronLeft}Home</a>
        <button class="ex-picker" id="exercises" aria-haspopup="dialog" aria-label="Exercise ${position}, choose exercise">
          <span class="mono">${position}</span>${icons.chevronDown}
        </button>
      </div>
      <div class="routine-progress" aria-hidden="true">${steps.map(() => '<i></i>').join('')}</div>
      <h1 tabindex="-1">${esc(steps[index]!.exercise.name)}</h1>
      <p class="muted step-purpose">${esc(steps[index]!.exercise.purpose)}</p>
    </header>`;
}

export function stepList(plan: readonly PlannedSubStep[]): string {
  if (!plan.length) return '';
  return `<ol class="substeps">${plan
    .map(
      (p, i) => `<li><button class="row-btn substep" data-sub="${i}">
        ${rowLead(`${i + 1} ·`)}
        <span class="row-text">${esc(p.subStep.text)}</span>
        <span class="mono">${listValue(p)}</span>
      </button></li>`,
    )
    .join('')}</ol>`;
}

export function detailSheet(exercise: Exercise): string {
  return `
    <dialog class="sheet" id="sheet" aria-labelledby="sheet-title">
      <h2 id="sheet-title">${esc(exercise.name)}</h2>
      ${exercise.tips?.length ? `<h3>Tips</h3><ul>${exercise.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      ${
        exercise.links.length
          ? `<h3>Reference</h3><ul class="links">${exercise.links
              .map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`)
              .join('')}</ul>`
          : '<p class="muted">No reference links for this one.</p>'
      }
      <button class="btn" id="close-sheet">Close</button>
    </dialog>`;
}

export function exerciseSheet(steps: readonly Step[], index: number): string {
  return `
    <dialog class="sheet" id="ex-sheet" aria-labelledby="ex-sheet-title">
      <h2 id="ex-sheet-title">Exercises</h2>
      <ol class="jump-list">
        ${steps
          .map((s, i) => {
            const current = i === index;
            return `<li><button class="row-btn jump ${current ? 'current' : ''}" data-jump="${i}" ${current ? 'aria-current="step"' : ''}>
              <span class="row-lead">${i + 1}.</span>
              <span class="row-text">${esc(s.exercise.name)}</span>
              <span class="mono">${formatClock(s.seconds)}</span>
              ${rowCheck(', done')}
            </button></li>`;
          })
          .join('')}
      </ol>
      <button class="btn" id="close-ex-sheet">Close</button>
    </dialog>`;
}

export const leaveDialog = `
  <dialog class="confirm" id="leave" aria-labelledby="leave-title">
    <h2 id="leave-title">Leave the routine?</h2>
    <p class="muted">Today only counts once you finish.</p>
    <div class="confirm-actions">
      <button class="btn btn-primary" id="stay">Stay</button>
      <button class="btn" id="leave-yes">Leave</button>
    </div>
  </dialog>`;
