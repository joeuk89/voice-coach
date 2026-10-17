import { animationFor, mountAnimation, type AnimationPlayer } from '../animations';
import { mountReadingPanel } from '../panels/reading';
import { mountSustainPanel, type SustainPanel } from '../panels/sustain';
import { $, closeOnBackdrop, on, playEntrance, replayClass } from '../lib/dom';
import { allowSleep, keepAwake } from '../lib/wakelock';
import { planSubSteps, type PlannedSubStep } from '../state/plan';
import { isLast, nextPosition, prevPosition, type Position } from '../state/position';
import { exerciseState, finishStep, isStepFinished } from '../state/progress';
import { endSession, getSession } from '../state/session';
import { exampleChips } from '../lib/example-chips';
import { icons } from '../lib/icons';
import { mountAudioStep } from './guided/audio-step';
import { detailSheet, exerciseSheet, leaveDialog, stepHeader, stepList } from './guided/markup';
import { mountHoldCount, mountPaced, mountReps, mountTimed, mountUntimed, type RowHooks, type StepRow } from './guided/timer-row';

export function renderGuided(root: HTMLElement): () => void {
  const found = getSession();
  if (!found) {
    location.replace('#/');
    return () => undefined;
  }
  const session = found;
  const { steps, progress } = session;

  keepAwake();
  let plan: PlannedSubStep[] = [];
  let player: AnimationPlayer | undefined;
  let stopPanel: (() => void) | undefined;
  let sustain: SustainPanel | undefined;
  let stepRow: StepRow | undefined;
  let audioStep: StepRow | undefined;
  /** Whether the user has started this sub-step's control since entering it. */
  let engaged = false;
  let stepDone = false;

  const hooks: RowHooks = {
    setDone: setStepDone,
    started() {
      engaged = true;
      showPrimary();
    },
  };

  function teardownExercise() {
    engaged = false;
    stepRow?.stop();
    stepRow = undefined;
    player?.stop();
    player = undefined;
    stopPanel?.();
    stopPanel = undefined;
    sustain = undefined;
    audioStep?.stop();
    audioStep = undefined;
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
    playEntrance(root);
    window.scrollTo(0, 0);
    const keep = focusedId === 'next' || focusedId === 'back' ? root.querySelector<HTMLButtonElement>(`#${focusedId}`) : null;
    const target = keep?.disabled ? $(root, '#next') : (keep ?? $(root, 'h1'));
    target.focus({ preventScroll: true });
  }

  function showExercise() {
    teardownExercise();
    const step = steps[session.index]!;
    const { exercise } = step;
    const isAudio = exercise.kind === 'audio';
    const def = animationFor(exercise.animation);
    plan = planSubSteps(exercise, step.seconds, step.reps);

    root.innerHTML = `
      ${stepHeader(steps, session.index)}

      <section class="card demo" id="demo" ${def || isAudio ? '' : 'hidden'}></section>

      ${
        plan.length
          ? `<section class="substep-now" aria-live="polite">
              <div class="substep-body">
                <div class="eyebrow" id="sub-eyebrow"></div>
                <p class="substep-text" id="sub-text"></p>
              </div>
            </section>`
          : ''
      }

      <div class="timer-row" id="timer-row" ${isAudio || exercise.panel === 'sustain' ? 'hidden' : ''}></div>

      <section class="${exercise.panel === 'sustain' ? 'hold-panel' : 'card panel'}" id="panel" ${exercise.panel ? '' : 'hidden'}></section>

      ${stepList(plan)}

      <button class="btn btn-ghost" id="detail">Tips and sources</button>

      <nav class="step-nav">
        <button class="btn btn-square" id="back" aria-label="Back">${icons.chevronLeft}</button>
        <button class="btn" id="next">Next</button>
      </nav>

      ${detailSheet(exercise)}
      ${exerciseSheet(steps, session.index)}
      ${leaveDialog}
    `;

    const demo = $(root, '#demo');
    demo.classList.toggle('compact', Boolean(exercise.panel));
    const showDemo = (input?: string) => {
      if (!def) return;
      player?.stop();
      player = mountAnimation(demo, def, { caption: false, input });
      if (exercise.panel && def.compactViewBox) demo.querySelector('svg')?.setAttribute('viewBox', def.compactViewBox);
      player.setWindow(plan[session.subIndex]?.subStep.window);
    };
    // The reading panel picks the passage, and the card draws that passage's demo line.
    if (exercise.panel !== 'reading') showDemo();
    if (exercise.panel === 'sustain') {
      sustain = mountSustainPanel($(root, '#panel'), {
        onRecord: () => stepRow?.hold?.(1),
        onUndo: () => stepRow?.hold?.(-1),
        onRunning: (running) => stepRow?.holdRunning?.(running),
      });
      stopPanel = sustain.stop;
    }
    if (exercise.panel === 'reading') stopPanel = mountReadingPanel($(root, '#panel'), (passage) => showDemo(passage.demo));
    if (isAudio && exercise.audioSrc) {
      demo.classList.add('player-card');
      audioStep = mountAudioStep(demo, exercise.audioSrc, step.seconds, hooks);
    }

    bindNavigation();
    showSubStep();
  }

  function bindNavigation() {
    on(root, '.substep', 'click', (_ev, el) => {
      goTo({ index: session.index, subIndex: Number(el.dataset['sub']) });
    });
    on(root, '#back', 'click', () => {
      const pos = prevPosition(steps, session);
      if (pos) goTo(pos);
    });
    on(root, '#next', 'click', () => {
      finishCurrentStep();
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
      const index = Number(el.dataset['jump']);
      if (index !== session.index) goTo({ index, subIndex: 0 });
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
  }

  /** One primary per state: the step's own control while it runs, then Next or Finish. */
  function setStepDone(done: boolean, complete: boolean) {
    stepDone = done;
    if (complete) finishCurrentStep();
    showPrimary();
  }

  /** A sub-step finished earlier keeps Next primary until the user starts it again. */
  function showPrimary() {
    const done = stepDone || (!engaged && isStepFinished(progress, session.index, session.subIndex));
    $(root, '#next').classList.toggle('btn-primary', done);
    root.querySelectorAll('[data-primary]').forEach((el) => el.classList.toggle('btn-primary', !done));
    sustain?.setPrimary(!done);
  }

  function finishCurrentStep() {
    finishStep(progress, session.index, session.subIndex, Math.max(0, plan.length - 1));
    showProgress();
  }

  function showProgress() {
    root.querySelectorAll<HTMLElement>('.routine-progress i').forEach((seg, i) => {
      const state = exerciseState(progress, i, session.index);
      seg.classList.toggle('done', state === 'done');
      seg.classList.toggle('current', state === 'current');
    });
    root.querySelectorAll<HTMLElement>('.jump').forEach((row, i) => row.classList.toggle('finished', progress.exercises.has(i)));
    root
      .querySelectorAll<HTMLElement>('.substep')
      .forEach((row, i) => row.classList.toggle('finished', isStepFinished(progress, session.index, i)));
  }

  function crossfadeSubStep() {
    const body = $(root, '.substep-body');
    if (!body.textContent?.trim()) return;
    const ghost = body.cloneNode(true) as HTMLElement;
    ghost.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    ghost.classList.remove('swapping');
    ghost.classList.add('substep-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.addEventListener('animationend', () => ghost.remove());
    body.after(ghost);
    replayClass(body, 'swapping');
  }

  function showSubStep() {
    const back = $<HTMLButtonElement>(root, '#back');
    const backHadFocus = document.activeElement === back;
    back.disabled = prevPosition(steps, session) === null;
    if (back.disabled && backHadFocus) $(root, '#next').focus({ preventScroll: true });
    $(root, '#next').textContent = isLast(steps, session) ? 'Finish' : 'Next';

    const current = plan[session.subIndex];
    showProgress();
    if (!current) {
      if (!audioStep) setStepDone(true, false);
      return;
    }
    crossfadeSubStep();
    $(root, '#sub-eyebrow').textContent = `Step ${session.subIndex + 1} of ${plan.length}`;
    $(root, '#sub-text').textContent = current.subStep.text;
    const body = $(root, '.substep-body');
    body.querySelector('.examples')?.remove();
    body.insertAdjacentHTML('beforeend', exampleChips(current.subStep.examples));
    player?.setWindow(current.subStep.window);
    root.querySelectorAll<HTMLElement>('.substep').forEach((row, i) => {
      const isCurrent = i === session.subIndex;
      row.classList.toggle('current', isCurrent);
      if (isCurrent) row.setAttribute('aria-current', 'step');
      else row.removeAttribute('aria-current');
    });
    showStepControl(current);
  }

  function showStepControl(current: PlannedSubStep) {
    stepRow?.stop();
    engaged = false;
    sustain?.setStep(session.subIndex);
    const row = $(root, '#timer-row');
    if (current.mode === 'untimed') stepRow = mountUntimed(row, hooks);
    else if (current.mode === 'timed') stepRow = mountTimed(row, current, hooks);
    else if (current.mode === 'paced') stepRow = mountPaced(row, current, hooks, player);
    else if (sustain) stepRow = mountHoldCount(sustain, current, hooks);
    else stepRow = mountReps(row, current, hooks);
  }

  showExercise();

  return () => {
    teardownExercise();
    allowSleep();
    if (location.hash !== '#/done') endSession();
  };
}
