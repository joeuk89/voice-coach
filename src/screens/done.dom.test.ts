// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exercises } from '../exercises';
import { renderPassage } from '../lib/passage';
import { todaysPassage } from '../paragraphs';
import { localDay } from '../state/log';
import { endSession, startSession } from '../state/session';
import { stubLocalStorage } from '../test/local-storage';
import type { LogEntry } from '../types';
import { renderDone } from './done';

const startRoutine = () => startSession('full', exercises.slice(0, 3).map((exercise) => ({ exercise, seconds: 60 })));

let storage: Storage;
let root: HTMLElement;
let cleanup: (() => void) | undefined;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 18, 9));
  storage = stubLocalStorage();
  root = document.createElement('div');
  startRoutine();
});

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  endSession();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** `count` earlier completions, one a day up to yesterday. */
function seedLog(count: number) {
  const entries: LogEntry[] = Array.from({ length: count }, (_, i) => {
    const d = new Date(2026, 9, 17 - i, 8);
    return { date: localDay(d), completedAt: d.toISOString(), routine: 'full', totalSec: 600 };
  });
  storage.setItem('vt.log', JSON.stringify(entries.reverse()));
}

const weeklyCard = () => root.querySelector('.weekly-check');

describe('renderDone weekly check', () => {
  it('asks for a recording on the 7th saved completion, with today’s passage', () => {
    seedLog(6);
    cleanup = renderDone(root);
    const card = weeklyCard();
    expect(card?.querySelector('h2')?.textContent).toBe('Weekly check');
    expect(card?.querySelector('.passage')?.innerHTML).toBe(renderPassage(todaysPassage().text));
    expect(card?.querySelector('strong')).not.toBeNull();
  });

  it('sits between the week strip and the feeling card', () => {
    seedLog(13);
    cleanup = renderDone(root);
    const sections = [...root.querySelectorAll('section')];
    expect(sections.map((s) => s.className)).toEqual(['card done-week', 'card weekly-check', 'card']);
  });

  it('stays hidden on other days', () => {
    for (const earlier of [0, 5, 7, 12]) {
      startRoutine();
      seedLog(earlier);
      cleanup = renderDone(root);
      expect(weeklyCard(), `${earlier + 1} completions`).toBeNull();
    }
  });

  it('stays hidden when today’s routine could not be saved', () => {
    seedLog(7);
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    cleanup = renderDone(root);
    expect(root.querySelector('h1')?.textContent).toBe('Not saved on this phone');
    expect(weeklyCard()).toBeNull();
  });

  it('adds no second primary button', () => {
    seedLog(6);
    cleanup = renderDone(root);
    expect(root.querySelectorAll('.btn-primary')).toHaveLength(1);
  });
});
