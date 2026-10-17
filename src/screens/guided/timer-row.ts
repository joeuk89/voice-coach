import { playCue } from '../../lib/audio';
import { $, formatClock } from '../../lib/dom';
import { buzz } from '../../lib/haptics';
import { icons } from '../../lib/icons';
import { createCountdown, type Countdown } from '../../lib/timer';
import type { SustainPanel } from '../../panels/sustain';
import type { PlannedSubStep } from '../../state/plan';
import { isComplete, repLabel } from '../../state/reps';

const DOUBLE_TAP_MS = 350;
const UNTIMED_HINT = 'No timer. Tap Next when you’re ready.';

const doneMark = `<span class="done-mark">${icons.check}</span>`;
const resetButton = `<button class="btn btn-square" id="timer-reset" aria-label="Reset" disabled>${icons.reset}</button>`;

export interface RowHooks {
  /** `done` hands the primary style to Next; `complete` also ticks the step as finished. */
  setDone(done: boolean, complete: boolean): void;
  /** The user started the step's own control: a timer, a rep or a hold. */
  started(): void;
}

export interface StepRow {
  stop(): void;
  /** Counts a recorded hold (+1) or an undone one (-1) on a hold-counting step. */
  hold?(delta: number): void;
  holdRunning?(running: boolean): void;
}

const idle: StepRow = { stop: () => undefined };

export function mountUntimed(row: HTMLElement, hooks: RowHooks): StepRow {
  row.innerHTML = `<p class="muted timer-hint">${UNTIMED_HINT}</p>`;
  hooks.setDone(true, false);
  return idle;
}

export function mountTimed(row: HTMLElement, planned: PlannedSubStep, hooks: RowHooks): StepRow {
  const { seconds } = planned;
  row.innerHTML = `
    <div class="timer-readout">
      <div class="timer" id="clock" aria-live="off">${formatClock(seconds)}</div>
      <span class="done-mark" id="clock-check" hidden>${icons.check}</span>
    </div>
    <button class="btn timer-btn" id="timer-toggle" data-primary>Start</button>
    ${resetButton}`;
  const clock = $(row, '#clock');
  const check = $(row, '#clock-check');
  const toggle = $<HTMLButtonElement>(row, '#timer-toggle');
  const reset = $<HTMLButtonElement>(row, '#timer-reset');
  let timer: Countdown | undefined;

  function showFinished(finished: boolean) {
    if (finished && document.activeElement === toggle) reset.focus({ preventScroll: true });
    toggle.hidden = finished;
    clock.classList.toggle('done', finished);
    check.hidden = !finished;
    hooks.setDone(finished || seconds <= 0, finished);
  }

  function restart() {
    timer?.pause();
    clock.classList.remove('paused');
    showFinished(false);
    toggle.textContent = 'Start';
    toggle.disabled = seconds <= 0;
    reset.disabled = true;
    timer = createCountdown(
      seconds,
      (left) => {
        clock.textContent = formatClock(left);
      },
      () => {
        playCue();
        buzz();
        showFinished(true);
      },
    );
  }

  restart();
  toggle.addEventListener('click', () => {
    const running = timer!.toggle();
    if (running) hooks.started();
    toggle.textContent = running ? 'Pause' : 'Resume';
    clock.classList.toggle('paused', !running);
    reset.disabled = false;
  });
  reset.addEventListener('click', () => {
    toggle.focus({ preventScroll: true });
    restart();
  });
  return { stop: () => timer?.pause() };
}

interface Counter {
  add(delta: number): void;
  reset(): void;
}

/** Holds past the target keep counting, so an Undo after an extra hold stays complete. */
function createCounter(target: number, draw: (count: number, complete: boolean) => void): Counter {
  let count = 0;
  draw(count, false);
  return {
    add(delta) {
      const wasComplete = isComplete(count, target);
      count = Math.max(0, count + delta);
      if (!wasComplete && isComplete(count, target)) buzz();
      draw(count, isComplete(count, target));
    },
    reset() {
      count = 0;
      draw(count, false);
    },
  };
}

function countMarkup(count: number, target: number, noun: string, repsPerPitch?: number): string {
  const label = repLabel(count, target, noun, repsPerPitch);
  return `<small>${label.lead}</small> ${label.shown} <small>${label.tail}</small>`;
}

export function mountReps(row: HTMLElement, planned: PlannedSubStep, hooks: RowHooks): StepRow {
  const target = planned.reps!;
  row.innerHTML = `
    <div class="timer rep-count" id="reps" aria-live="polite"></div>
    <button class="btn timer-btn" id="rep-add" data-primary>+1 rep</button>
    ${resetButton}`;
  const counter = $(row, '#reps');
  const add = $<HTMLButtonElement>(row, '#rep-add');
  const reset = $<HTMLButtonElement>(row, '#timer-reset');

  const reps = createCounter(target, (count, complete) => {
    if (complete && document.activeElement === add) reset.focus({ preventScroll: true });
    counter.innerHTML = `${countMarkup(count, target, 'Rep')}${complete ? doneMark : ''}`;
    counter.classList.toggle('done', complete);
    add.hidden = complete;
    reset.disabled = count === 0;
    hooks.setDone(complete, complete);
  });

  let lastAddAt = -Infinity;
  add.addEventListener('click', (ev) => {
    if (ev.timeStamp - lastAddAt < DOUBLE_TAP_MS) return;
    lastAddAt = ev.timeStamp;
    hooks.started();
    reps.add(1);
  });
  reset.addEventListener('click', () => {
    add.hidden = false;
    add.focus({ preventScroll: true });
    reps.reset();
  });
  return idle;
}

/** Vocal function exercises: the sustain stopwatch is the step's control, and each recorded hold counts. */
export function mountHoldCount(sustain: SustainPanel, planned: PlannedSubStep, hooks: RowHooks): StepRow {
  const target = planned.reps!;
  const { row, note } = sustain;
  row.querySelector('#timer-reset')?.remove();
  row.insertAdjacentHTML('beforeend', resetButton);
  const reset = $<HTMLButtonElement>(row, '#timer-reset');

  let count = 0;
  const showReset = () => {
    reset.disabled = count === 0 && !sustain.isRunning();
  };
  const holds = createCounter(target, (next, complete) => {
    count = next;
    note.innerHTML = countMarkup(next, target, 'Hold', planned.subStep.repsPerPitch);
    row.classList.toggle('done', complete);
    showReset();
    hooks.setDone(complete, complete);
  });

  reset.addEventListener('click', () => {
    sustain.focusToggle();
    sustain.resetStep();
    holds.reset();
  });
  return {
    stop: () => undefined,
    hold: holds.add,
    holdRunning(running) {
      if (running) hooks.started();
      showReset();
    },
  };
}
