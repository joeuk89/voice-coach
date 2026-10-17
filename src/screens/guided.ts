import { animationFor, mountAnimation, type AnimationPlayer } from '../animations';
import { mountReadingPanel } from '../panels/reading';
import { mountSustainPanel, type SustainPanel } from '../panels/sustain';
import { playCue } from '../lib/audio';
import { $, esc, formatClock, on } from '../lib/dom';
import { buzz } from '../lib/haptics';
import { createCountdown, type Countdown } from '../lib/timer';
import { allowSleep, keepAwake } from '../lib/wakelock';
import { planSubSteps, type PlannedSubStep } from '../state/plan';
import { isLast, nextPosition, prevPosition, type Position } from '../state/position';
import { isComplete, repLabel } from '../state/reps';
import { endSession, getSession } from '../state/session';
import type { Exercise } from '../types';

const START_HINT = 'Tap Play to start the track.';

function timerControls(seconds: number, startLabel: string): string {
  return `
    <div class="timer" id="clock" aria-live="off">${formatClock(seconds)}</div>
    <button class="btn btn-primary timer-btn" id="timer-toggle">${startLabel}</button>
    <button class="btn timer-btn" id="timer-restart">Restart</button>`;
}

function listValue(planned: PlannedSubStep): string {
  if (planned.mode === 'untimed') return '';
  if (planned.mode === 'reps') return `× ${planned.reps}`;
  return formatClock(planned.seconds);
}

function detailSheet(exercise: Exercise): string {
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

function closeOnBackdrop(dialog: HTMLDialogElement): void {
  dialog.addEventListener('click', (ev) => {
    if (ev.target === dialog) dialog.close();
  });
}

export function renderGuided(root: HTMLElement): () => void {
  const found = getSession();
  if (!found) {
    location.replace('#/');
    return () => undefined;
  }
  const session = found;
  const { steps } = session;

  keepAwake();
  let plan: PlannedSubStep[] = [];
  let timer: Countdown | undefined;
  let player: AnimationPlayer | undefined;
  let stopPanel: (() => void) | undefined;
  let sustain: SustainPanel | undefined;
  let onHold: ((delta: number) => void) | undefined;
  let audio: HTMLAudioElement | undefined;

  function teardownExercise() {
    timer?.pause();
    timer = undefined;
    player?.stop();
    player = undefined;
    stopPanel?.();
    stopPanel = undefined;
    sustain = undefined;
    onHold = undefined;
    audio?.pause();
    audio = undefined;
  }

  function goTo(pos: Position) {
    if (pos.index === session.index && pos.subIndex === session.subIndex) return;
    const sameExercise = pos.index === session.index;
    session.index = pos.index;
    session.subIndex = pos.subIndex;
    if (sameExercise) {
      showSubStep();
      root.querySelector('.substep-now')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    const focusedId = document.activeElement?.id;
    showExercise();
    window.scrollTo(0, 0);
    const keep = focusedId === 'next' || focusedId === 'back' ? root.querySelector<HTMLElement>(`#${focusedId}`) : null;
    (keep ?? $(root, 'h1')).focus({ preventScroll: true });
  }

  function showExercise() {
    teardownExercise();
    const step = steps[session.index]!;
    const { exercise } = step;
    const isAudio = exercise.kind === 'audio';
    const def = animationFor(exercise.animation);
    plan = planSubSteps(exercise, step.seconds);

    root.innerHTML = `
      <header class="step-head">
        <div class="step-top">
          <a class="back-link" href="#/" id="home"><span aria-hidden="true">‹</span> Home</a>
          <button class="ex-picker eyebrow" id="exercises" aria-haspopup="dialog">
            Exercise ${session.index + 1} of ${steps.length} · ${formatClock(step.seconds)} <span aria-hidden="true">▾</span>
          </button>
        </div>
        <h1 tabindex="-1">${esc(exercise.name)}</h1>
        <p class="muted">${esc(exercise.purpose)}</p>
      </header>

      <section class="card demo" id="demo" ${def || isAudio ? '' : 'hidden'}></section>

      ${
        plan.length
          ? `<section class="substep-now" aria-live="polite">
              <div class="eyebrow" id="sub-eyebrow"></div>
              <p class="substep-text" id="sub-text"></p>
            </section>`
          : ''
      }

      <div class="timer-row" id="timer-row"></div>

      <section class="card panel" id="panel" ${exercise.panel ? '' : 'hidden'}></section>

      ${
        plan.length
          ? `<ol class="substeps">${plan
              .map(
                (p, i) => `<li><button class="row-btn substep" data-sub="${i}">
                  <span>${esc(p.subStep.text)}</span>
                  <span class="mono">${listValue(p)}</span>
                </button></li>`,
              )
              .join('')}</ol>`
          : ''
      }

      <button class="btn btn-ghost" id="detail">More detail</button>

      <nav class="step-nav">
        <button class="btn" id="back">Back</button>
        <button class="btn" id="next">Next</button>
      </nav>

      ${detailSheet(exercise)}

      <dialog class="sheet" id="ex-sheet" aria-labelledby="ex-sheet-title">
        <h2 id="ex-sheet-title">Exercises</h2>
        <ol class="jump-list">
          ${steps
            .map((s, i) => {
              const current = i === session.index;
              return `<li><button class="row-btn jump ${current ? 'current' : ''}" data-jump="${i}" ${current ? 'aria-current="step"' : ''}>
                <span>${i + 1}. ${esc(s.exercise.name)}</span>
                <span class="mono">${formatClock(s.seconds)}</span>
              </button></li>`;
            })
            .join('')}
        </ol>
        <button class="btn" id="close-ex-sheet">Close</button>
      </dialog>

      <dialog class="confirm" id="leave" aria-labelledby="leave-title">
        <h2 id="leave-title">Leave the routine?</h2>
        <p class="muted">It will not be marked as done today.</p>
        <div class="confirm-actions">
          <button class="btn btn-primary" id="stay">Stay</button>
          <button class="btn" id="leave-yes">Leave</button>
        </div>
      </dialog>
    `;

    const demo = $(root, '#demo');
    if (def) player = mountAnimation(demo, def, { caption: false });
    if (exercise.panel === 'sustain') {
      sustain = mountSustainPanel($(root, '#panel'), {
        onRecord: () => onHold?.(1),
        onUndo: () => onHold?.(-1),
      });
      stopPanel = sustain.stop;
    }
    if (exercise.panel === 'reading') stopPanel = mountReadingPanel($(root, '#panel'));
    if (isAudio && exercise.audioSrc) mountAudioStep(demo, exercise.audioSrc, step.seconds);

    on(root, '.substep', 'click', (_ev, el) => {
      goTo({ index: session.index, subIndex: Number(el.dataset['sub']) });
    });
    on(root, '#back', 'click', () => {
      const pos = prevPosition(steps, session);
      if (pos) goTo(pos);
    });
    on(root, '#next', 'click', () => {
      const pos = nextPosition(steps, session);
      if (pos) goTo(pos);
      else location.hash = '#/done';
    });

    const sheet = $<HTMLDialogElement>(root, '#sheet');
    on(root, '#detail', 'click', () => sheet.showModal());
    on(root, '#close-sheet', 'click', () => sheet.close());
    closeOnBackdrop(sheet);

    const exSheet = $<HTMLDialogElement>(root, '#ex-sheet');
    on(root, '#exercises', 'click', () => exSheet.showModal());
    on(root, '#close-ex-sheet', 'click', () => exSheet.close());
    on(root, '.jump', 'click', (_ev, el) => {
      exSheet.close();
      goTo({ index: Number(el.dataset['jump']), subIndex: 0 });
    });
    closeOnBackdrop(exSheet);

    const leave = $<HTMLDialogElement>(root, '#leave');
    on(root, '#home', 'click', (ev) => {
      ev.preventDefault();
      leave.showModal();
    });
    on(root, '#stay', 'click', () => leave.close());
    on(root, '#leave-yes', 'click', () => {
      leave.close();
      location.hash = '#/';
    });
    closeOnBackdrop(leave);

    showSubStep();
  }

  function showSubStep() {
    $<HTMLButtonElement>(root, '#back').disabled = prevPosition(steps, session) === null;
    const last = isLast(steps, session);
    const next = $(root, '#next');
    next.textContent = last ? 'Finish' : 'Next';
    next.classList.toggle('btn-primary', last);

    const current = plan[session.subIndex];
    if (!current) return;
    $(root, '#sub-eyebrow').textContent = `Step ${session.subIndex + 1} of ${plan.length}`;
    $(root, '#sub-text').textContent = current.subStep.text;
    player?.setWindow(current.subStep.window);
    root.querySelectorAll<HTMLElement>('.substep').forEach((row, i) => {
      const isCurrent = i === session.subIndex;
      row.classList.toggle('current', isCurrent);
      if (isCurrent) row.setAttribute('aria-current', 'step');
      else row.removeAttribute('aria-current');
    });
    showTimer(current);
  }

  function showTimer(current: PlannedSubStep) {
    timer?.pause();
    timer = undefined;
    onHold = undefined;
    sustain?.resetStep();
    const row = $(root, '#timer-row');
    if (current.mode === 'untimed') {
      row.innerHTML = '<span class="muted">No timer for this step</span>';
      return;
    }
    if (current.mode === 'reps') {
      showReps(row, current);
      return;
    }
    row.innerHTML = timerControls(current.seconds, 'Start');
    const clock = $(row, '#clock');
    const toggle = $<HTMLButtonElement>(row, '#timer-toggle');

    function reset() {
      timer?.pause();
      clock.classList.remove('paused', 'done');
      toggle.textContent = 'Start';
      toggle.disabled = current.seconds <= 0;
      timer = createCountdown(
        current.seconds,
        (left) => {
          clock.textContent = formatClock(left);
        },
        () => {
          playCue();
          buzz();
          toggle.textContent = 'Start';
          toggle.disabled = true;
          clock.classList.add('done');
        },
      );
    }

    reset();
    toggle.addEventListener('click', () => {
      const running = timer!.toggle();
      toggle.textContent = running ? 'Pause' : 'Resume';
      clock.classList.toggle('paused', !running);
    });
    $(row, '#timer-restart').addEventListener('click', reset);
  }

  function showReps(row: HTMLElement, current: PlannedSubStep) {
    const target = current.reps!;
    const countsHolds = steps[session.index]!.exercise.panel === 'sustain';
    row.innerHTML = `
      <div class="timer rep-count" id="reps" aria-live="polite"></div>
      ${countsHolds ? '' : '<button class="btn btn-primary timer-btn" id="rep-done">Done</button>'}
      <button class="btn timer-btn" id="timer-restart">Restart</button>`;
    const counter = $(row, '#reps');
    const done = row.querySelector<HTMLButtonElement>('#rep-done');
    let count = 0;

    function draw() {
      const label = repLabel(count, target, countsHolds ? 'Hold' : 'Rep', current.subStep.repsPerPitch);
      counter.innerHTML = `${label.lead ? `<small>${label.lead}</small> ` : ''}${label.shown} <small>${label.tail}</small>`;
      const complete = isComplete(count, target);
      counter.classList.toggle('done', complete);
      if (done) done.disabled = complete;
    }

    function add(delta: number) {
      const wasComplete = isComplete(count, target);
      count = Math.max(0, count + delta);
      if (!wasComplete && isComplete(count, target)) buzz();
      draw();
    }

    draw();
    done?.addEventListener('click', () => add(1));
    $(row, '#timer-restart').addEventListener('click', () => {
      count = 0;
      sustain?.resetStep();
      draw();
    });
    if (countsHolds) onHold = add;
  }

  function mountAudioStep(demo: HTMLElement, src: string, seconds: number) {
    demo.innerHTML = `
      <div class="audio-step">
        <div class="audio-bar"><i id="audio-progress"></i></div>
        <div class="muted" id="audio-status">${START_HINT}</div>
      </div>`;
    const row = $(root, '#timer-row');
    row.innerHTML = timerControls(seconds, 'Play');
    const bar = $(demo, '#audio-progress');
    const status = $(demo, '#audio-status');
    const clock = $(row, '#clock');
    const toggle = $<HTMLButtonElement>(row, '#timer-toggle');
    const restart = $<HTMLButtonElement>(row, '#timer-restart');
    const track = new Audio(src);
    track.preload = 'auto';
    audio = track;

    function showTime() {
      if (!Number.isFinite(track.duration)) return;
      clock.textContent = formatClock(track.duration - track.currentTime);
      bar.style.transform = `scaleX(${track.currentTime / track.duration})`;
    }

    track.addEventListener('loadedmetadata', showTime);
    track.addEventListener('timeupdate', showTime);
    track.addEventListener('play', () => {
      toggle.textContent = 'Pause';
      status.textContent = 'Playing';
      clock.classList.remove('paused', 'done');
    });
    track.addEventListener('pause', () => {
      if (track.ended) return;
      const started = track.currentTime > 0;
      toggle.textContent = 'Play';
      status.textContent = started ? 'Paused' : START_HINT;
      clock.classList.toggle('paused', started);
    });
    track.addEventListener('ended', () => {
      buzz();
      toggle.textContent = 'Play';
      status.textContent = 'Track finished. Tap Next when you are ready.';
      clock.classList.add('done');
    });
    track.addEventListener('error', () => {
      toggle.disabled = true;
      restart.disabled = true;
      status.textContent = 'Could not load the track. Tap Next to carry on.';
    });

    toggle.addEventListener('click', () => {
      if (!track.paused) {
        track.pause();
        return;
      }
      track.play().catch((err: unknown) => {
        if (track.error || (err instanceof DOMException && err.name === 'AbortError')) return;
        status.textContent = 'Playback blocked. Tap Play again.';
      });
    });
    restart.addEventListener('click', () => {
      track.pause();
      track.currentTime = 0;
      clock.classList.remove('paused', 'done');
      status.textContent = START_HINT;
      showTime();
    });
  }

  showExercise();

  return () => {
    teardownExercise();
    allowSleep();
    if (location.hash !== '#/done') endSession();
  };
}
