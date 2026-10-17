import { animationFor, mountAnimation } from '../animations';
import { mountSustainPanel } from '../panels/sustain';
import { playCue } from '../lib/audio';
import { $, esc, formatClock, on } from '../lib/dom';
import { buzz } from '../lib/haptics';
import { createCountdown, type Countdown } from '../lib/timer';
import { allowSleep, keepAwake } from '../lib/wakelock';
import { getSession, type Session, type Step } from '../state/session';

export function renderGuided(root: HTMLElement): () => void {
  const session = getSession();
  if (!session) {
    location.replace('#/');
    return () => undefined;
  }

  keepAwake();
  let timer: Countdown | undefined;
  let stopAnimation: (() => void) | undefined;
  let stopPanel: (() => void) | undefined;
  let audio: HTMLAudioElement | undefined;

  function teardownStep() {
    timer?.stop();
    timer = undefined;
    stopAnimation?.();
    stopAnimation = undefined;
    stopPanel?.();
    stopPanel = undefined;
    audio?.pause();
    audio = undefined;
  }

  function finishStep(elapsed: number) {
    session!.elapsedSec += elapsed;
    teardownStep();
  }

  function goTo(index: number) {
    if (index >= session!.steps.length) {
      location.hash = '#/done';
      return;
    }
    session!.index = Math.max(0, index);
    showStep(session!);
  }

  function showStep(s: Session) {
    const step = s.steps[s.index]!;
    const { exercise } = step;
    const total = s.steps.length;
    const isAudio = exercise.kind === 'audio';
    const def = animationFor(exercise.animation);

    root.innerHTML = `
      <header class="step-head">
        <div class="eyebrow">Exercise ${s.index + 1} of ${total} · ${formatClock(step.seconds)}</div>
        <h1>${esc(exercise.name)}</h1>
        <p class="muted">${esc(exercise.purpose)}</p>
      </header>

      <section class="card demo" id="demo" ${def || isAudio ? '' : 'hidden'}></section>

      <ul class="cues">
        ${exercise.cues.map((c) => `<li>${esc(c)}</li>`).join('')}
      </ul>

      <section class="card panel" id="panel" ${exercise.panel ? '' : 'hidden'}></section>

      <div class="timer-row">
        <div class="timer" id="clock" aria-live="off">${formatClock(step.seconds)}</div>
        <button class="btn btn-ghost" id="detail">More detail</button>
      </div>

      <nav class="controls">
        <button class="btn" id="back" ${s.index === 0 ? 'disabled' : ''}>Back</button>
        <button class="btn btn-primary" id="toggle">Pause</button>
        <button class="btn" id="skip">Skip</button>
      </nav>

      <dialog class="sheet" id="sheet">
        <h2>${esc(exercise.name)}</h2>
        ${exercise.tips?.length ? `<h3>Tips</h3><ul>${exercise.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        ${
          exercise.links.length
            ? `<h3>Reference</h3><ul class="links">${exercise.links
                .map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`)
                .join('')}</ul>`
            : '<p class="muted">No reference links for this one.</p>'
        }
        <button class="btn" id="close-sheet">Close</button>
      </dialog>
    `;

    const demo = $(root, '#demo');
    if (def) stopAnimation = mountAnimation(demo, def);
    if (exercise.panel === 'sustain') stopPanel = mountSustainPanel($(root, '#panel'));

    const clock = $(root, '#clock');
    const toggle = $<HTMLButtonElement>(root, '#toggle');

    if (isAudio && exercise.audioSrc) {
      mountAudioStep(demo, exercise.audioSrc, step, clock, toggle);
    } else {
      timer = createCountdown(
        step.seconds,
        (left) => {
          clock.textContent = formatClock(left);
        },
        () => {
          playCue();
          buzz();
          finishStep(step.seconds);
          goTo(s.index + 1);
        },
      );
      timer.start();
      toggle.addEventListener('click', () => {
        const running = timer!.toggle();
        toggle.textContent = running ? 'Pause' : 'Resume';
        clock.classList.toggle('paused', !running);
      });
    }

    on(root, '#back', 'click', () => {
      finishStep(timer?.elapsedSec ?? 0);
      goTo(s.index - 1);
    });
    on(root, '#skip', 'click', () => {
      finishStep(timer?.elapsedSec ?? 0);
      goTo(s.index + 1);
    });

    const sheet = $<HTMLDialogElement>(root, '#sheet');
    on(root, '#detail', 'click', () => sheet.showModal());
    on(root, '#close-sheet', 'click', () => sheet.close());
    sheet.addEventListener('click', (ev) => {
      if (ev.target === sheet) sheet.close();
    });
  }

  function mountAudioStep(demo: HTMLElement, src: string, step: Step, clock: HTMLElement, toggle: HTMLButtonElement) {
    demo.innerHTML = `
      <div class="audio-step">
        <div class="audio-bar"><i id="audio-progress"></i></div>
        <div class="muted" id="audio-status">Tap Play to start the track.</div>
      </div>`;
    const bar = $(demo, '#audio-progress');
    const status = $(demo, '#audio-status');
    audio = new Audio(src);
    audio.preload = 'auto';
    toggle.textContent = 'Play';

    audio.addEventListener('timeupdate', () => {
      if (!audio || !Number.isFinite(audio.duration)) return;
      const left = audio.duration - audio.currentTime;
      clock.textContent = formatClock(left);
      bar.style.transform = `scaleX(${audio.currentTime / audio.duration})`;
    });
    audio.addEventListener('play', () => {
      toggle.textContent = 'Pause';
      status.textContent = 'Playing';
    });
    audio.addEventListener('pause', () => {
      if (audio && !audio.ended) {
        toggle.textContent = 'Play';
        status.textContent = 'Paused';
      }
    });
    audio.addEventListener('ended', () => {
      buzz();
      finishStep(Math.round(audio?.duration ?? step.seconds));
      goTo(session!.index + 1);
    });
    audio.addEventListener('error', () => {
      status.textContent = 'Could not load the track. Skip to carry on.';
    });

    toggle.addEventListener('click', () => {
      if (!audio) return;
      if (audio.paused) void audio.play().catch(() => (status.textContent = 'Playback blocked. Tap Play again.'));
      else audio.pause();
    });
  }

  showStep(session);

  return () => {
    teardownStep();
    allowSleep();
  };
}
