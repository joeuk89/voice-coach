// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountAudioStep } from './audio-step';
import type { RowHooks } from './timer-row';

const SECONDS = 836;

interface Mounted {
  card: HTMLElement;
  hooks: RowHooks & { setDone: ReturnType<typeof vi.fn>; started: ReturnType<typeof vi.fn> };
  track: HTMLAudioElement;
}

function mount(): Mounted {
  const card = document.createElement('section');
  document.body.append(card);
  const hooks = { setDone: vi.fn(), started: vi.fn() };
  const RealAudio = window.Audio;
  let track!: HTMLAudioElement;
  vi.stubGlobal('Audio', function (src: string) {
    track = new RealAudio(src);
    return track;
  });
  mountAudioStep(card, '/voice-coach/audio/track.mp3', SECONDS, hooks);
  return { card, hooks, track };
}

const fetchStub = vi.fn();
const el = <T extends HTMLElement>(card: HTMLElement, sel: string) => card.querySelector<T>(sel)!;
const seekInput = (card: HTMLElement) => el<HTMLInputElement>(card, '#audio-seek');
const text = (card: HTMLElement, sel: string) => el(card, sel).textContent;

function seekWith(card: HTMLElement, value: number) {
  const input = seekInput(card);
  input.value = String(value);
  input.dispatchEvent(new Event('input'));
}

beforeEach(() => {
  fetchStub.mockReset();
  fetchStub.mockResolvedValue(new Response(JSON.stringify({ duration: SECONDS, peaks: [0.2, 1, 0.5] })));
  vi.stubGlobal('fetch', fetchStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('mountAudioStep', () => {
  it('labels the slider and gives the time as its value text', () => {
    const { card } = mount();
    const input = seekInput(card);
    expect(input.getAttribute('aria-label')).toBe('Track position');
    expect(input.getAttribute('aria-valuetext')).toBe('0:00 of 13:56');
    expect(el(card, '#audio-back').getAttribute('aria-label')).toBe('Back 10 seconds');
    expect(el(card, '#audio-forward').getAttribute('aria-label')).toBe('Forward 10 seconds');
  });

  it('draws the waveform from the peaks file next to the track', async () => {
    const { card } = mount();
    await vi.waitFor(() => expect(card.querySelectorAll('.wave rect').length).toBeGreaterThan(2));
    expect(fetchStub).toHaveBeenCalledWith('/voice-coach/audio/track.peaks.json');
  });

  it('falls back to a flat bar when the peaks file is missing', async () => {
    fetchStub.mockResolvedValue(new Response('Not found', { status: 404 }));
    const { card } = mount();
    await vi.waitFor(() => expect(card.querySelectorAll('.wave rect')).toHaveLength(2));
  });

  it('counts a seek as starting without starting playback', () => {
    const { card, hooks, track } = mount();
    seekWith(card, 418);
    expect(track.currentTime).toBe(418);
    expect(track.paused).toBe(true);
    expect(hooks.started).toHaveBeenCalledOnce();
    expect(el<HTMLButtonElement>(card, '#audio-reset').disabled).toBe(false);
    expect(text(card, '#audio-elapsed')).toBe('6:58');
    expect(text(card, '#audio-remaining')).toBe('−6:58');
    expect(seekInput(card).getAttribute('aria-valuetext')).toBe('6:58 of 13:56');
  });

  it('skips 10 s each way and clamps at the start', () => {
    const { card, hooks, track } = mount();
    el(card, '#audio-back').click();
    expect(track.currentTime).toBe(0);
    expect(hooks.started).toHaveBeenCalledOnce();
    el(card, '#audio-forward').click();
    el(card, '#audio-forward').click();
    expect(track.currentTime).toBe(20);
    el(card, '#audio-back').click();
    expect(track.currentTime).toBe(10);
  });

  it('marks the step done when a skip reaches the end', () => {
    const { card, hooks, track } = mount();
    seekWith(card, SECONDS - 4);
    el(card, '#audio-forward').click();
    expect(track.currentTime).toBe(SECONDS);
    expect(hooks.setDone).toHaveBeenLastCalledWith(true, true);
    expect(text(card, '#audio-status')).toBe('Track finished. Tap Next when you’re ready.');
  });

  it('keeps the step done after seeking back and playing; only Reset clears it', async () => {
    const { card, hooks, track } = mount();
    await track.play();
    track.pause();
    track.dispatchEvent(new Event('ended'));
    expect(hooks.setDone).toHaveBeenLastCalledWith(true, true);

    seekWith(card, 60);
    el(card, '#audio-toggle').click();
    await Promise.resolve();
    expect(track.paused).toBe(false);
    expect(hooks.setDone).toHaveBeenLastCalledWith(true, true);
    expect(text(card, '#audio-status')).toBe('Playing');

    el(card, '#audio-reset').click();
    expect(hooks.setDone).toHaveBeenLastCalledWith(false, false);
    expect(track.currentTime).toBe(0);
    expect(text(card, '#audio-status')).toBe('Tap Play to start the track.');
    expect(el<HTMLButtonElement>(card, '#audio-reset').disabled).toBe(true);
  });

  it('buzzes and finishes once when the browser also fires ended after a seek to the end', () => {
    const { card, hooks, track } = mount();
    seekWith(card, SECONDS);
    track.dispatchEvent(new Event('ended'));
    expect(hooks.setDone.mock.calls.filter(([done]) => done)).toHaveLength(1);
  });
});
