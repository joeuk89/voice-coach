import { describe, expect, it } from 'vitest';
import { foldPeaks, parsePeaks, peaksUrl, waveformShapes, WAVE_HEIGHT } from './waveform';

describe('peaksUrl', () => {
  it('swaps the track extension for .peaks.json', () => {
    expect(peaksUrl('/voice-coach/audio/track.mp3')).toBe('/voice-coach/audio/track.peaks.json');
  });
});

describe('parsePeaks', () => {
  it('returns the peaks clamped to 0..1', () => {
    expect(parsePeaks({ duration: 10, peaks: [0, 0.5, 1.2, -0.1] })).toEqual([0, 0.5, 1, 0]);
  });

  it('rejects data without a usable list', () => {
    expect(parsePeaks(null)).toBeNull();
    expect(parsePeaks({})).toBeNull();
    expect(parsePeaks({ peaks: [] })).toBeNull();
    expect(parsePeaks({ peaks: [0.2, 'loud'] })).toBeNull();
    expect(parsePeaks({ peaks: [0.2, null] })).toBeNull();
  });
});

describe('foldPeaks', () => {
  it('keeps the loudest value in each slice', () => {
    expect(foldPeaks([0.1, 0.9, 0.2, 0.3, 0.8, 0.4], 3)).toEqual([0.9, 0.3, 0.8]);
  });

  it('repeats values when there are more bars than peaks', () => {
    expect(foldPeaks([0.2, 0.6], 4)).toEqual([0.2, 0.2, 0.6, 0.6]);
  });
});

describe('waveformShapes', () => {
  const rects = (svg: string) => [...svg.matchAll(/<rect ([^/]*)\/>/g)].map((m) => m[1]!);
  const attr = (rect: string, name: string) => Number(new RegExp(`${name}="([^"]+)"`).exec(rect)![1]);

  it('draws one 2 px bar every 3 px, centred in the width', () => {
    const bars = rects(waveformShapes([0.5], 300));
    expect(bars).toHaveLength(100);
    expect(attr(bars[0]!, 'x')).toBe(0.5);
    expect(attr(bars[1]!, 'x') - attr(bars[0]!, 'x')).toBe(3);
  });

  it('mirrors each bar about the centre line with a minimum height', () => {
    const [loud, silent] = rects(waveformShapes([1, 0], 5));
    expect(attr(loud!, 'height')).toBe(WAVE_HEIGHT);
    expect(attr(loud!, 'y')).toBe(0);
    expect(attr(silent!, 'height')).toBe(2);
    expect(attr(silent!, 'y')).toBe(WAVE_HEIGHT / 2 - 1);
  });

  it('draws one flat bar across the width without peaks', () => {
    const bars = rects(waveformShapes(null, 280));
    expect(bars).toHaveLength(1);
    expect(attr(bars[0]!, 'width')).toBe(280);
  });
});
