import { $, esc } from '../lib/dom';
import { paragraphs } from '../paragraphs';

function dayNumber(d = new Date()): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
}

/** *marked* words become bold so the eye lands on the pitch moves. */
function renderPassage(text: string): string {
  return esc(text).replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
}

/** Today's passage, with a button to step to the next one. */
export function mountReadingPanel(container: HTMLElement): () => void {
  let index = dayNumber() % paragraphs.length;

  function draw() {
    const text = paragraphs[index] ?? '';
    container.innerHTML = `
      <div class="reading-head">
        <h2>Read this</h2>
        <span class="muted">${index + 1} of ${paragraphs.length}</span>
      </div>
      <p class="passage">${renderPassage(text)}</p>
      <p class="muted reading-hint">Once over the top, then again at 70 percent.</p>
      <button class="btn btn-ghost" id="next-passage">Another</button>`;
    $(container, '#next-passage').addEventListener('click', () => {
      index = (index + 1) % paragraphs.length;
      draw();
    });
  }

  draw();
  return () => undefined;
}
