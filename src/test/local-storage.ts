import { vi } from 'vitest';

/** Replaces the global localStorage with an empty in-memory one. */
export function stubLocalStorage(): Storage {
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, String(value)),
    removeItem: (key) => void data.delete(key),
    clear: () => data.clear(),
  };
  vi.stubGlobal('localStorage', storage);
  return storage;
}
