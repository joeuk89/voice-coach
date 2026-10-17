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

/** m:ss under an hour, then hours and minutes. */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  if (s < 3600) return formatClock(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return m ? `${h} h ${m} min` : `${h} h`;
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

/** Runs `draw`, then refocuses the new element with the focused one's `data-focus` key, or the h1 if it is gone. */
export function redrawKeepingFocus(root: ParentNode, draw: () => void): void {
  const active = document.activeElement;
  const key = active instanceof HTMLElement ? active.dataset['focus'] : undefined;
  draw();
  if (!key) return;
  const target = root.querySelector<HTMLElement>(`[data-focus="${key}"]:not(:disabled)`) ?? root.querySelector<HTMLElement>('h1');
  target?.focus({ preventScroll: true });
}

export function closeOnBackdrop(dialog: HTMLDialogElement): void {
  dialog.addEventListener('click', (ev) => {
    if (ev.target === dialog) dialog.close();
  });
}

/** Restarts a CSS animation tied to `className`, even if the class is already on. */
export function replayClass(el: HTMLElement, className: string): void {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

export function playEntrance(screen: HTMLElement): void {
  replayClass(screen, 'entering');
}
