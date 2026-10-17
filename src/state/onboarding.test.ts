import { beforeEach, describe, expect, it } from 'vitest';
import { stubLocalStorage } from '../test/local-storage';
import { markOnboarded, needsOnboarding } from './onboarding';

let storage: Storage;

beforeEach(() => {
  storage = stubLocalStorage();
});

describe('needsOnboarding', () => {
  it('is true on a first ever open', () => {
    expect(needsOnboarding()).toBe(true);
  });

  it('is false once marked', () => {
    markOnboarded();
    expect(storage.getItem('vt.onboarded')).toBe('true');
    expect(needsOnboarding()).toBe(false);
  });

  it('is false when a log already exists', () => {
    storage.setItem('vt.log', JSON.stringify([{ date: '2026-10-17', completedAt: '2026-10-17T08:00:00.000Z', routine: 'full', totalSec: 600 }]));
    expect(needsOnboarding()).toBe(false);
  });

  it('ignores a corrupt flag', () => {
    storage.setItem('vt.onboarded', '{');
    expect(needsOnboarding()).toBe(true);
  });
});
