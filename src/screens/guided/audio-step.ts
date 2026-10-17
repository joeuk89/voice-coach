import { $, formatClock } from '../../lib/dom';
import { buzz } from '../../lib/haptics';
import { icons } from '../../lib/icons';
import type { RowHooks, StepRow } from './timer-row';
import { parsePeaks, peaksUrl, waveformShapes, WAVE_HEIGHT } from './waveform';

const START_HINT = 'Tap Play to start the track.';
const FINISHED = 'Track finished. Tap Next when you’re ready.';
const SKIP_SEC = 10;
const playIcon = icons.play.replace('class="icon"', 'class="icon player-icon"');
const pauseIcon = icons.pause.replace('class="icon"', 'class="icon player-icon"');

/** The bundled track as a small player. It never moves the routine on by itself. */
export function mountAudioStep(card: HTMLElement, src: string, seconds: number, hooks: RowHooks): StepRow {
  card.innerHTML = `
    <div class="player">
      <h2 class="player-title">Roger Love · guided scales</h2>
      <div class="scrub">
        <svg class="wave" height="${WAVE_HEIGHT}" aria-hidden="true" focusable="false"></svg>
        <div class="wave-played" aria-hidden="true">
          <svg class="wave" height="${WAVE_HEIGHT}" focusable="false"></svg>
        </div>
        <i class="wave-head" aria-hidden="true"></i>
        <input type="range" class="scrub-input" id="audio-seek" min="0" max="${Math.ceil(seconds)}" step="1" value="0"
          aria-label="Track position">
      </div>
      <div class="player-times mono">
        <span id="audio-elapsed">0:00</span>
        <span id="audio-remaining">−${formatClock(seconds)}</span>
      </div>
      <div class="player-controls">
        <div class="player-row">
          <button class="btn btn-ghost player-skip" id="audio-back" aria-label="Back ${SKIP_SEC} seconds">${icons.back10}</button>
          <button class="btn player-toggle" id="audio-toggle" data-primary></button>
          <button class="btn btn-ghost player-skip" id="audio-forward" aria-label="Forward ${SKIP_SEC} seconds">${icons.forward10}</button>
        </div>
        <button class="btn btn-ghost btn-small player-reset" id="audio-reset" disabled>${icons.reset}Reset</button>
      </div>
      <p class="muted player-status" id="audio-status" aria-live="polite">${START_HINT}</p>
    </div>`;
  const scrub = $(card, '.scrub');
  const [restWave, playedWave] = card.querySelectorAll<SVGSVGElement>('.wave');
  const played = $(card, '.wave-played');
  const head = $(card, '.wave-head');
  const seek = $<HTMLInputElement>(card, '#audio-seek');
  const elapsed = $(card, '#audio-elapsed');
  const remaining = $(card, '#audio-remaining');
  const status = $(card, '#audio-status');
  const toggle = $<HTMLButtonElement>(card, '#audio-toggle');
  const back = $<HTMLButtonElement>(card, '#audio-back');
  const forward = $<HTMLButtonElement>(card, '#audio-forward');
  const reset = $<HTMLButtonElement>(card, '#audio-reset');

  const track = new Audio(src);
  track.preload = 'auto';
  let peaks: number[] | null = null;
  let peaksSettled = false;
  let waveWidth = 0;
  let begun = false;
  let atEnd = false;
  let scrubbing = false;
  let stopped = false;

  const duration = () => (Number.isFinite(track.duration) && track.duration > 0 ? track.duration : seconds);

  function drawWave() {
    const width = Math.round(scrub.clientWidth) || 300;
    if (width === waveWidth || !peaksSettled) return;
    waveWidth = width;
    const shapes = waveformShapes(peaks, width);
    for (const svg of [restWave!, playedWave!]) {
      svg.setAttribute('width', String(width));
      svg.setAttribute('viewBox', `0 0 ${width} ${WAVE_HEIGHT}`);
      svg.innerHTML = shapes;
    }
  }

  function showToggle(playing: boolean) {
    toggle.innerHTML = playing ? pauseIcon : playIcon;
    toggle.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  function showStatus(text: string) {
    if (status.textContent !== text) status.textContent = text;
  }

  function showPosition(at = track.currentTime) {
    const total = duration();
    const fraction = Math.min(1, Math.max(0, at / total));
    elapsed.textContent = formatClock(at);
    remaining.textContent = `−${formatClock(total - at)}`;
    played.style.clipPath = `inset(0 ${(1 - fraction) * 100}% 0 0)`;
    head.style.left = `${fraction * 100}%`;
    if (!scrubbing) seek.value = String(Math.round(at));
    seek.setAttribute('aria-valuetext', `${formatClock(at)} of ${formatClock(total)}`);
  }

  function finish() {
    if (atEnd) return;
    atEnd = true;
    buzz();
    showToggle(false);
    showStatus(FINISHED);
    hooks.setDone(true, true);
  }

  /** Seeking counts as starting the step but never starts playback. */
  function seekTo(at: number) {
    if (!begun) {
      begun = true;
      reset.disabled = false;
      hooks.started();
    }
    const total = duration();
    const target = Math.min(total, Math.max(0, at));
    track.currentTime = target;
    showPosition(target);
    if (target >= total) {
      finish();
      return;
    }
    atEnd = false;
    if (track.paused) showStatus(target > 0 ? 'Paused' : START_HINT);
  }

  showToggle(false);
  hooks.setDone(false, false);
  showPosition(0);

  fetch(peaksUrl(src))
    .then((res) => (res.ok ? res.json() : null))
    .then(parsePeaks)
    .catch(() => null)
    .then((loaded) => {
      if (stopped) return;
      peaks = loaded;
      peaksSettled = true;
      drawWave();
    });
  const resized = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(drawWave);
  resized?.observe(scrub);

  track.addEventListener('loadedmetadata', () => {
    seek.max = String(Math.ceil(duration()));
    showPosition();
  });
  track.addEventListener('timeupdate', () => showPosition());
  track.addEventListener('play', () => {
    atEnd = false;
    begun = true;
    showToggle(true);
    showStatus('Playing');
    reset.disabled = false;
    hooks.started();
  });
  track.addEventListener('pause', () => {
    if (track.ended) return;
    showToggle(false);
    showStatus(track.currentTime > 0 ? 'Paused' : START_HINT);
  });
  track.addEventListener('ended', finish);
  track.addEventListener('error', () => {
    for (const control of [toggle, back, forward, reset, seek]) control.disabled = true;
    hooks.setDone(true, false);
    showStatus('Could not load the track. Tap Next to carry on.');
  });

  seek.addEventListener('pointerdown', () => (scrubbing = true));
  for (const type of ['pointerup', 'pointercancel'] as const) seek.addEventListener(type, () => (scrubbing = false));
  seek.addEventListener('input', () => seekTo(Number(seek.value)));
  back.addEventListener('click', () => seekTo(track.currentTime - SKIP_SEC));
  forward.addEventListener('click', () => seekTo(track.currentTime + SKIP_SEC));

  toggle.addEventListener('click', () => {
    if (!track.paused) {
      track.pause();
      return;
    }
    track.play().catch((err: unknown) => {
      if (track.error || (err instanceof DOMException && err.name === 'AbortError')) return;
      showStatus('Playback blocked. Tap Play again.');
    });
  });
  reset.addEventListener('click', () => {
    toggle.focus({ preventScroll: true });
    track.pause();
    track.currentTime = 0;
    begun = false;
    atEnd = false;
    reset.disabled = true;
    hooks.setDone(false, false);
    showStatus(START_HINT);
    showPosition(0);
  });

  return {
    stop() {
      stopped = true;
      resized?.disconnect();
      track.pause();
    },
  };
}
