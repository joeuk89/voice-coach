/** Dev page: every animation on one screen, with sub-step chips and a scrubber to pause the loops at a point. */
import './style.css';
import { animationFor, mountAnimation, type AnimationPlayer } from './animations';
import type { LoopWindow } from './animations/window';
import { exercises } from './exercises';
import { esc } from './lib/dom';

function shortLabel(text: string, max = 18): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,.:;]+$/, '')}…`;
}

const shown = exercises.filter((e) => e.animation);
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header>
    <a class="back-link" href="./"><span aria-hidden="true">‹</span> App</a>
    <h1>Animations</h1>
    <label class="muted">Scrub <input id="scrub" type="range" min="0" max="100" value="0"> <span id="scrub-val">live</span></label>
  </header>
  ${shown
    .map(
      (e) => `<section>
        <h2>${esc(e.name)}</h2>
        <div class="card demo" data-anim="${e.animation}"></div>
        <div class="win-chips" role="group" aria-label="Loop window">
          ${e.subSteps
            .map(
              (s, i) => `<button class="win-chip" data-sub="${i}" aria-pressed="false" title="${esc(s.text)}">
                <b>${i + 1}</b> ${esc(shortLabel(s.text))}
              </button>`,
            )
            .join('')}
          <button class="win-chip" data-sub="all" aria-pressed="true">Whole loop</button>
        </div>
      </section>`,
    )
    .join('')}
`;

interface Card {
  player: AnimationPlayer;
  selected: LoopWindow | undefined;
}

const cards: Card[] = [];
app.querySelectorAll<HTMLElement>('section').forEach((section, i) => {
  const exercise = shown[i]!;
  const def = animationFor(exercise.animation);
  if (!def) return;
  const card: Card = { player: mountAnimation(section.querySelector<HTMLElement>('[data-anim]')!, def), selected: undefined };
  cards.push(card);
  section.querySelectorAll<HTMLButtonElement>('.win-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const sub = chip.dataset['sub'];
      card.selected = sub === 'all' ? undefined : exercise.subSteps[Number(sub)]?.window;
      section.querySelectorAll('.win-chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      if (!scrubbing) card.player.setWindow(card.selected);
    });
  });
});

const scrub = document.querySelector<HTMLInputElement>('#scrub')!;
const scrubVal = document.querySelector<HTMLElement>('#scrub-val')!;
let scrubbing = false;
scrub.addEventListener('input', () => {
  scrubbing = true;
  scrubVal.textContent = `${scrub.value}%`;
  cards.forEach((c) => c.player.scrubTo(Number(scrub.value) / 100));
});
scrub.addEventListener('dblclick', () => {
  if (!scrubbing) return;
  scrubbing = false;
  scrubVal.textContent = 'live';
  cards.forEach((c) => c.player.setWindow(c.selected));
});
