import { describe, expect, it } from 'vitest';
import { layoutDemo } from './animations/read-aloud';
import { paragraphs } from './paragraphs';

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
