import { $, formatClock } from '../../lib/dom';
import { buzz } from '../../lib/haptics';
import { icons } from '../../lib/icons';
import type { RowHooks, StepRow } from './timer-row';

const START_HINT = 'Tap Play to start the track.';
const playIcon = icons.play.replace('class="icon"', 'class="icon player-icon"');
const pauseIcon = icons.pause.replace('class="icon"', 'class="icon player-icon"');

/** The bundled track as a small player. It never moves the routine on by itself. */
export function mountAudioStep(card: HTMLElement, src: string, seconds: number, hooks: RowHooks): StepRow {
  card.innerHTML = `
    <div class="player">
      <h2 class="player-title">Roger Love · guided scales</h2>
      <div class="audio-bar"><i id="audio-progress"></i></div>
      <div class="player-times mono">
        <span id="audio-elapsed">0:00</span>
        <span id="audio-remaining">−${formatClock(seconds)}</span>
      </div>
      <div class="player-controls">
        <button class="btn player-toggle" id="audio-toggle" data-primary></button>
        <button class="btn btn-ghost btn-small player-reset" id="audio-reset" disabled>${icons.reset}Reset</button>
      </div>
      <p class="muted player-status" id="audio-status" aria-live="polite">${START_HINT}</p>
    </div>`;
  const bar = $(card, '#audio-progress');
  const elapsed = $(card, '#audio-elapsed');
  const remaining = $(card, '#audio-remaining');
  const status = $(card, '#audio-status');
  const toggle = $<HTMLButtonElement>(card, '#audio-toggle');
  const reset = $<HTMLButtonElement>(card, '#audio-reset');

  function showToggle(playing: boolean) {
    toggle.innerHTML = playing ? pauseIcon : playIcon;
    toggle.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  showToggle(false);
  hooks.setDone(false, false);
  const track = new Audio(src);
  track.preload = 'auto';

  function showTime() {
    if (!Number.isFinite(track.duration)) return;
    elapsed.textContent = formatClock(track.currentTime);
    remaining.textContent = `−${formatClock(track.duration - track.currentTime)}`;
    bar.style.transform = `scaleX(${track.currentTime / track.duration})`;
  }

  track.addEventListener('loadedmetadata', showTime);
  track.addEventListener('timeupdate', showTime);
  track.addEventListener('play', () => {
    showToggle(true);
    status.textContent = 'Playing';
    reset.disabled = false;
    hooks.started();
    hooks.setDone(false, false);
  });
  track.addEventListener('pause', () => {
    if (track.ended) return;
    const started = track.currentTime > 0;
    showToggle(false);
    status.textContent = started ? 'Paused' : START_HINT;
  });
  track.addEventListener('ended', () => {
    buzz();
    showToggle(false);
    status.textContent = 'Track finished. Tap Next when you’re ready.';
    hooks.setDone(true, true);
  });
  track.addEventListener('error', () => {
    toggle.disabled = true;
    reset.disabled = true;
    hooks.setDone(true, false);
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
  reset.addEventListener('click', () => {
    toggle.focus({ preventScroll: true });
    track.pause();
    track.currentTime = 0;
    reset.disabled = true;
    hooks.setDone(false, false);
    status.textContent = START_HINT;
    showTime();
  });

  return { stop: () => track.pause() };
}
