export function esc(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function formatMinutes(totalSec: number): string {
  if (totalSec <= 0) return '0 min';
  return `${Math.max(1, Math.round(totalSec / 60))} min`;
}

export function $<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

export function on<K extends keyof HTMLElementEventMap>(
  root: ParentNode,
  selector: string,
  event: K,
  handler: (ev: HTMLElementEventMap[K], el: HTMLElement) => void,
): void {
  root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    el.addEventListener(event, (ev) => handler(ev as HTMLElementEventMap[K], el));
  });
}
