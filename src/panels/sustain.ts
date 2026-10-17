import { $, esc } from '../lib/dom';
import { buzz } from '../lib/haptics';
import { icons } from '../lib/icons';
import { localDay } from '../state/log';
import { bestEver, previousBest, recordSustain, removeLastSustain, todaySustains } from '../state/sustains';

function fmt(sec: number): string {
  return `${sec.toFixed(1)} s`;
}

function clockMarkup(sec: number): string {
  return `${sec.toFixed(1)}<small>s</small>`;
}

const MIN_HOLD_SEC = 0.5;
const MAX_CHIPS = 8;
export const TOO_SHORT = 'Too short to count (under 0.5 s)';

/** Leads the Today line: today's holds follow it, or it stands alone before the first one. */
export function summaryNote(today: readonly number[], previous: number, best: number): string {
  if (best <= 0) return 'First time: tap Start hold as the note begins.';
  if (today.length) return `Best ever ${fmt(best)} · Today`;
  return previous > 0 ? `Last time ${fmt(previous)} · Best ever ${fmt(best)}` : `Best ever ${fmt(best)}`;
}

/** Newest first, capped, with how many older holds were left out. */
export function recentHolds(today: readonly number[], max = MAX_CHIPS): { shown: number[]; more: number } {
  const newest = today.slice().reverse();
  return { shown: newest.slice(0, max), more: Math.max(0, newest.length - max) };
}

export interface SustainEvents {
  onRecord?: () => void;
  onUndo?: () => void;
  onRunning?: (running: boolean) => void;
}

export interface SustainPanel {
  /** The hold row: stopwatch and Start hold, where the screen adds its Reset. */
  readonly row: HTMLElement;
  /** Where the screen shows its hold count, under the stopwatch. */
  readonly note: HTMLElement;
  /** Start a new sub-step: a running hold is discarded and Undo forgets earlier holds. */
  resetStep(): void;
  /** Whether Start hold carries the screen's primary style. */
  setPrimary(primary: boolean): void;
  isRunning(): boolean;
  focusToggle(): void;
  stop(): void;
}

/** Tap-to-start, tap-to-stop stopwatch for sustained notes; each hold is logged for the day. */
export function mountSustainPanel(container: HTMLElement, events: SustainEvents = {}): SustainPanel {
  let startedAt = 0;
  let interval: ReturnType<typeof setInterval> | undefined;
  let stepHolds: string[] = [];
  let tooShort = false;

  container.innerHTML = `
    <div class="timer-row hold-row">
      <div class="timer-readout">
        <div class="timer hold-clock" id="sustain-clock" aria-live="off">${clockMarkup(0)}</div>
        <span class="done-mark hold-check">${icons.check}</span>
      </div>
      <button class="btn btn-primary timer-btn hold-btn" id="sustain-toggle">Start hold</button>
      <div class="timer-note"><span id="hold-note" aria-live="polite"></span><span id="undo-slot"></span></div>
    </div>
    <div class="sustain-today" id="sustain-today" aria-live="polite"></div>`;
  const row = $(container, '.hold-row');
  const clock = $(container, '#sustain-clock');
  const button = $<HTMLButtonElement>(container, '#sustain-toggle');
  const todayEl = $(container, '#sustain-today');
  const undoSlot = $(container, '#undo-slot');

  function drawToday() {
    const running = interval !== undefined;
    const today = todaySustains();
    const { shown, more } = recentHolds(today);
    todayEl.innerHTML = `
      ${tooShort ? `<span class="muted hold-short">${TOO_SHORT}</span>` : ''}
      <span class="muted">${esc(summaryNote(today, previousBest(), bestEver()))}</span>
      ${shown.map((s) => `<span class="chip mono">${esc(fmt(s))}</span>`).join('')}
      ${more ? `<span class="muted">+${more} more</span>` : ''}`;
    undoSlot.innerHTML =
      stepHolds.length && !running ? '<button class="btn btn-ghost btn-small" id="sustain-undo" aria-label="Undo last hold">Undo</button>' : '';
    undoSlot.querySelector('#sustain-undo')?.addEventListener('click', undo);
  }

  function showRunning(running: boolean) {
    button.textContent = running ? 'Stop' : 'Start hold';
    row.classList.toggle('running', running);
  }

  function showTooShort(short: boolean) {
    tooShort = short;
    row.classList.toggle('short', short);
  }

  function elapsed() {
    return (Date.now() - startedAt) / 1000;
  }

  function undo() {
    const day = stepHolds.pop();
    if (day === undefined) return;
    removeLastSustain(day);
    clock.innerHTML = clockMarkup(0);
    drawToday();
    events.onUndo?.();
  }

  function toggle() {
    if (interval) {
      const held = elapsed();
      const day = localDay();
      stop();
      clock.innerHTML = clockMarkup(held);
      showTooShort(held < MIN_HOLD_SEC);
      const recorded = !tooShort && recordSustain(held, day);
      if (recorded) stepHolds.push(day);
      buzz(40);
      drawToday();
      // After buzz(40), so a listener's own buzz replaces the short one.
      if (recorded) events.onRecord?.();
      return;
    }
    startedAt = Date.now();
    showTooShort(false);
    showRunning(true);
    clock.innerHTML = clockMarkup(0);
    interval = setInterval(() => {
      clock.innerHTML = clockMarkup(elapsed());
    }, 100);
    drawToday();
    events.onRunning?.(true);
  }

  function stop() {
    if (!interval) return;
    clearInterval(interval);
    interval = undefined;
    showRunning(false);
    events.onRunning?.(false);
  }

  function discardHold() {
    stop();
    showTooShort(false);
    clock.innerHTML = clockMarkup(0);
    drawToday();
  }

  button.addEventListener('click', toggle);
  drawToday();
  return {
    row,
    note: $(container, '#hold-note'),
    resetStep() {
      discardHold();
      stepHolds = [];
      drawToday();
    },
    setPrimary(primary) {
      button.classList.toggle('btn-primary', primary);
    },
    isRunning: () => interval !== undefined,
    focusToggle() {
      button.focus({ preventScroll: true });
    },
    stop,
  };
}
