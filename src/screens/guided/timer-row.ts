import type { AnimationPlayer } from '../../animations';
import { playCue } from '../../lib/audio';
import { $, formatClock } from '../../lib/dom';
import { buzz } from '../../lib/haptics';
import { icons } from '../../lib/icons';
import { createCountdown, type Countdown } from '../../lib/timer';
import type { SustainPanel } from '../../panels/sustain';
import { paceAt, type PaceMoment } from '../../state/pace';
import type { PlannedSubStep } from '../../state/plan';
import { isComplete, repLabel } from '../../state/reps';

const DOUBLE_TAP_MS = 350;
const PACE_TICK_MS = 100;
const SWITCH_BUZZ_MS = 40;
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

type PacedPicture = Pick<AnimationPlayer, 'rest' | 'restart' | 'pause'>;

/**
 * Paces each breath: Start runs a 3 s lead-in, then the picture and the row count every breath in
 * and out. Pause freezes the picture; Resume replays the interrupted breath after a new lead-in.
 */
export function mountPaced(row: HTMLElement, planned: PlannedSubStep, hooks: RowHooks, picture?: PacedPicture): StepRow {
  const pace = planned.subStep.pace!;
  const total = planned.reps!;
  row.innerHTML = `
    <div class="pace-readout">
      <div class="timer rep-count" id="pace-count" aria-live="polite"></div>
      <p class="pace-phase" aria-live="polite"><span id="pace-word"></span><span id="pace-left" aria-hidden="true"></span></p>
    </div>
    <button class="btn timer-btn" id="timer-toggle" data-primary>Start</button>
    ${resetButton}`;
  const count = $(row, '#pace-count');
  const phaseWord = $(row, '#pace-word');
  const phaseLeft = $(row, '#pace-left');
  const toggle = $<HTMLButtonElement>(row, '#timer-toggle');
  const reset = $<HTMLButtonElement>(row, '#timer-reset');

  /** The breath the next run starts on; a paused breath runs again in full. */
  let from = 0;
  let startedAt = 0;
  let interval: ReturnType<typeof setInterval> | undefined;
  let lastPhase = '';

  /** Writes only what changed, so the live regions announce the phase word at a switch and not every second. */
  function show(countHtml: string, word = '', left = '') {
    if (count.innerHTML !== countHtml) count.innerHTML = countHtml;
    if (phaseWord.textContent !== word) phaseWord.textContent = word;
    if (phaseLeft.textContent !== left) phaseLeft.textContent = left;
  }

  const breathMarkup = (breath: number) => countMarkup(breath + 1, total, 'Breath');

  function showMoment(moment: PaceMoment) {
    if (moment.phase === 'ready') {
      show(`<small>Ready ·</small> ${moment.secondsLeft}`);
      return;
    }
    const word = moment.phase === 'in' ? 'In' : 'Out';
    show(breathMarkup(moment.breath), word, ` · ${moment.secondsLeft}`);
  }

  const now = () => paceAt(performance.now() - startedAt, pace, total, from);

  function halt() {
    clearInterval(interval);
    interval = undefined;
  }

  function showFinished(finished: boolean) {
    if (finished && document.activeElement === toggle) reset.focus({ preventScroll: true });
    toggle.hidden = finished;
    count.classList.toggle('done', finished);
    hooks.setDone(finished, finished);
  }

  function finish() {
    halt();
    from = total;
    picture?.rest();
    show(`${breathMarkup(total - 1)}${doneMark}`);
    playCue();
    buzz();
    showFinished(true);
  }

  function tick() {
    const moment = now();
    if (moment.phase === 'done') return finish();
    const phase = `${moment.phase}${moment.breath}`;
    if (phase !== lastPhase && moment.phase !== 'ready') {
      buzz(SWITCH_BUZZ_MS);
      picture?.restart(moment.breathMs);
    }
    lastPhase = phase;
    showMoment(moment);
  }

  function run() {
    hooks.started();
    startedAt = performance.now();
    lastPhase = '';
    picture?.rest();
    count.classList.remove('paused');
    toggle.textContent = 'Pause';
    reset.disabled = false;
    interval = setInterval(tick, PACE_TICK_MS);
    tick();
  }

  function pause() {
    const moment = now();
    if (moment.phase === 'done') return finish();
    halt();
    if (moment.phase !== 'ready') from = moment.breath;
    picture?.pause();
    count.classList.add('paused');
    toggle.textContent = 'Resume';
    show(breathMarkup(from), 'Paused');
  }

  function restart() {
    halt();
    from = 0;
    picture?.rest();
    count.classList.remove('paused');
    showFinished(false);
    toggle.textContent = 'Start';
    reset.disabled = true;
    show(breathMarkup(0));
  }

  restart();
  toggle.addEventListener('click', () => (interval === undefined ? run() : pause()));
  reset.addEventListener('click', () => {
    toggle.focus({ preventScroll: true });
    restart();
  });
  return { stop: halt };
}
