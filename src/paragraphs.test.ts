import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { layoutDemo } from './animations/read-aloud';
import { paragraphs, todaysPassage, todaysPassageIndex } from './paragraphs';

const bold = (text: string) => [...text.matchAll(/\*([^*]+)\*/g)].map((m) => m[1]!);
const plain = (text: string) => text.replaceAll('*', '');

describe.each(paragraphs.map((p, i) => [i + 1, p] as const))('passage %i', (_n, passage) => {
  it('marks single words, 8 to 12 of them', () => {
    const words = bold(passage.text);
    expect(words.every((w) => !w.includes(' '))).toBe(true);
    expect(words.length).toBeGreaterThanOrEqual(8);
    expect(words.length).toBeLessThanOrEqual(12);
  });

  it('has a short demo line with 2 or 3 bold words', () => {
    expect(plain(passage.demo).split(' ').length).toBeGreaterThanOrEqual(4);
    expect(plain(passage.demo).split(' ').length).toBeLessThanOrEqual(8);
    expect(bold(passage.demo).length).toBeGreaterThanOrEqual(2);
    expect(bold(passage.demo).length).toBeLessThanOrEqual(3);
  });

  it('takes the demo line from the passage opening, marked the same way', () => {
    expect(plain(passage.text).startsWith(plain(passage.demo))).toBe(true);
    expect(passage.text.startsWith(passage.demo)).toBe(true);
  });

  it('fits the demo line on the card', () => {
    expect(layoutDemo(passage.demo).width).toBeLessThanOrEqual(290);
  });
});

describe('todaysPassage', () => {
  beforeAll(() => {
    vi.stubEnv('TZ', 'Europe/London');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('counts whole local days since 1 January 1970', () => {
    const days = Date.UTC(2026, 9, 18) / 86_400_000;
    expect(todaysPassageIndex(new Date(2026, 9, 18, 9))).toBe(days % paragraphs.length);
    expect(todaysPassage(new Date(2026, 9, 18, 9))).toBe(paragraphs[days % paragraphs.length]);
  });

  it('keeps one passage all day and steps on at local midnight', () => {
    const morning = todaysPassageIndex(new Date(2026, 9, 18, 0, 0));
    expect(todaysPassageIndex(new Date(2026, 9, 18, 23, 59))).toBe(morning);
    expect(todaysPassageIndex(new Date(2026, 9, 19, 0, 0))).toBe((morning + 1) % paragraphs.length);
  });

  it('steps one a day across the clocks going back and forward', () => {
    expect(todaysPassageIndex(new Date(2026, 9, 26, 0, 30))).toBe((todaysPassageIndex(new Date(2026, 9, 25, 0, 30)) + 1) % paragraphs.length);
    expect(todaysPassageIndex(new Date(2026, 2, 30, 0, 30))).toBe((todaysPassageIndex(new Date(2026, 2, 29, 0, 30)) + 1) % paragraphs.length);
  });

  it('goes through every passage once before coming round again', () => {
    const seen = Array.from({ length: paragraphs.length }, (_, i) => todaysPassageIndex(new Date(2026, 9, 18 + i, 12)));
    expect(new Set(seen).size).toBe(paragraphs.length);
    expect(todaysPassageIndex(new Date(2026, 9, 18 + paragraphs.length, 12))).toBe(seen[0]);
  });
});
