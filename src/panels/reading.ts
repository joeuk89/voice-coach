import { $, esc } from '../lib/dom';
import { paragraphs, type Passage } from '../paragraphs';

function dayNumber(d = new Date()): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
}

/** *marked* words become bold so the eye lands on the pitch moves. */
function renderPassage(text: string): string {
  return esc(text).replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
}

/** Today's passage, with a button to step to the next one. `onPassage` hears the first one and every change. */
export function mountReadingPanel(container: HTMLElement, onPassage?: (passage: Passage) => void): () => void {
  let index = dayNumber() % paragraphs.length;

  function draw() {
    const passage = paragraphs[index];
    container.innerHTML = `
      <p class="passage">${renderPassage(passage?.text ?? '')}</p>
      <p class="muted reading-hint">Over the top, then at 70 percent, then a pause before each bold word, then slow and quick clauses.</p>
      <div class="reading-foot">
        <button class="btn btn-ghost" id="next-passage">New passage</button>
        <span class="muted">${index + 1} of ${paragraphs.length}</span>
      </div>`;
    $(container, '#next-passage').addEventListener('click', () => {
      index = (index + 1) % paragraphs.length;
      draw();
    });
    if (passage) onPassage?.(passage);
  }

  draw();
  return () => undefined;
}
