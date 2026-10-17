import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stubLocalStorage } from '../test/local-storage';
import { read, write } from './storage';

let storage: Storage;

beforeEach(() => {
  storage = stubLocalStorage();
});

describe('read', () => {
  it('returns the parsed value', () => {
    storage.setItem('vt.thing', '{"a":1}');
    expect(read('thing')).toEqual({ a: 1 });
  });

  it('returns null when the key is missing, null or not JSON', () => {
    expect(read('thing')).toBeNull();
    storage.setItem('vt.thing', 'null');
    expect(read('thing')).toBeNull();
    storage.setItem('vt.thing', '{not json');
    expect(read('thing')).toBeNull();
  });

  it('returns null when storage is blocked', () => {
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(read('thing')).toBeNull();
  });
});

describe('write', () => {
  it('stores JSON under the vt. prefix and returns true', () => {
    expect(write('thing', [1, 2])).toBe(true);
    expect(storage.getItem('vt.thing')).toBe('[1,2]');
  });

  it('returns false when storage is full', () => {
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(write('thing', 1)).toBe(false);
  });
});
