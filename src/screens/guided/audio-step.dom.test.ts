// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buzz } from '../../lib/haptics';
import { mountAudioStep } from './audio-step';
import type { RowHooks } from './timer-row';

vi.mock('../../lib/haptics', () => ({ buzz: vi.fn() }));

const SECONDS = 836;

interface Mounted {
  card: HTMLElement;
  hooks: RowHooks & { setDone: ReturnType<typeof vi.fn>; started: ReturnType<typeof vi.fn> };
  track: HTMLAudioElement;
  stop: () => void;
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
  const row = mountAudioStep(card, '/voice-coach/audio/track.mp3', SECONDS, hooks);
  return { card, hooks, track, stop: row.stop };
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
  vi.mocked(buzz).mockClear();
  fetchStub.mockReset();
  fetchStub.mockResolvedValue(new Response(JSON.stringify({ duration: SECONDS, peaks: [0.2, 1, 0.5] })));
  vi.stubGlobal('fetch', fetchStub);
});

afterEach(() => {
  vi.restoreAllMocks();
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
    expect(buzz).toHaveBeenCalledOnce();
    expect(hooks.setDone.mock.calls.filter(([done]) => done)).toHaveLength(1);
  });

  it('restarts from the top when Play is pressed after a skip to the end, without finishing again', async () => {
    const { card, hooks, track } = mount();
    await track.play();
    seekWith(card, SECONDS - 4);
    el(card, '#audio-forward').click();
    expect(track.currentTime).toBe(SECONDS);
    expect(track.paused).toBe(true);
    expect(text(card, '#audio-status')).toBe('Track finished. Tap Next when you’re ready.');

    el(card, '#audio-toggle').click();
    await Promise.resolve();
    expect(track.currentTime).toBe(0);
    expect(track.paused).toBe(false);
    expect(buzz).toHaveBeenCalledOnce();
    expect(hooks.setDone.mock.calls.filter(([done]) => done)).toHaveLength(1);
    expect(hooks.setDone).toHaveBeenLastCalledWith(true, true);
  });

  it('revokes the blob URL when the step stops', async () => {
    vi.stubGlobal('navigator', { ...navigator, serviceWorker: { controller: {} } });
    fetchStub.mockImplementation(async (url: string) =>
      url.endsWith('.mp3') ? new Response(new Blob(['mp3'])) : new Response('{}'),
    );
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:track');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const { track, stop } = mount();
    await vi.waitFor(() => expect(track.src).toBe('blob:track'));
    expect(revoke).not.toHaveBeenCalled();
    stop();
    await vi.waitFor(() => expect(revoke).toHaveBeenCalledWith('blob:track'));
  });

  it('plays from a blob URL when a service worker serves the track, with Play disabled while it loads', async () => {
    vi.stubGlobal('navigator', { ...navigator, serviceWorker: { controller: {} } });
    let deliver!: (res: Response) => void;
    fetchStub.mockImplementation((url: string) =>
      url.endsWith('.mp3') ? new Promise((resolve) => (deliver = resolve)) : Promise.resolve(new Response('{}')),
    );
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:track');
    const { card, track } = mount();
    expect(el<HTMLButtonElement>(card, '#audio-toggle').disabled).toBe(true);
    expect(text(card, '#audio-status')).toBe('Loading track…');
    seekWith(card, 30);
    expect(text(card, '#audio-status')).toBe('Loading track…');

    deliver(new Response(new Blob(['mp3'])));
    await vi.waitFor(() => expect(track.src).toBe('blob:track'));
    expect(el<HTMLButtonElement>(card, '#audio-toggle').disabled).toBe(false);
    expect(text(card, '#audio-status')).toBe('Paused');
    expect(fetchStub).toHaveBeenCalledWith('/voice-coach/audio/track.mp3');
    createObjectURL.mockRestore();
  });

  it('falls back to the plain URL when the track fetch fails', async () => {
    vi.stubGlobal('navigator', { ...navigator, serviceWorker: { controller: {} } });
    fetchStub.mockImplementation(async (url: string) => {
      if (url.endsWith('.mp3')) throw new TypeError('Failed to fetch');
      return new Response('{}');
    });
    const { card, track } = mount();
    await vi.waitFor(() => expect(track.src).toContain('/voice-coach/audio/track.mp3'));
    expect(el<HTMLButtonElement>(card, '#audio-toggle').disabled).toBe(false);
    expect(text(card, '#audio-status')).toBe('Tap Play to start the track.');
  });

  it('streams the plain URL without a service worker', async () => {
    const { track } = mount();
    await vi.waitFor(() => expect(track.src).toContain('/voice-coach/audio/track.mp3'));
    expect(fetchStub).not.toHaveBeenCalledWith('/voice-coach/audio/track.mp3');
  });
});
