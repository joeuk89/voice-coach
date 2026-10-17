import './style.css';
import { animationFor, mountAnimation } from './animations';
import { exercises } from './exercises';
import { esc } from './lib/dom';

/** Dev page: every animation on one screen, with a scrubber to pause the loops at a point. */
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header>
    <a class="back-link" href="./">‹ App</a>
    <h1>Animations</h1>
    <label class="muted">Scrub <input id="scrub" type="range" min="0" max="100" value="0"> <span id="scrub-val">live</span></label>
  </header>
  ${exercises
    .filter((e) => e.animation)
    .map(
      (e) => `<section>
        <h2>${esc(e.name)}</h2>
        <div class="card demo" data-anim="${e.animation}"></div>
      </section>`,
    )
    .join('')}
`;

app.querySelectorAll<HTMLElement>('[data-anim]').forEach((el) => {
  const def = animationFor(el.dataset['anim'] as never);
  if (def) mountAnimation(el, def);
});

const scrub = document.querySelector<HTMLInputElement>('#scrub')!;
const scrubVal = document.querySelector<HTMLElement>('#scrub-val')!;
let scrubbing = false;
scrub.addEventListener('input', () => {
  scrubbing = true;
  const fraction = Number(scrub.value) / 100;
  scrubVal.textContent = `${scrub.value}%`;
  app.querySelectorAll<HTMLElement>('[data-anim]').forEach((card) => {
    const cycleMs = parseFloat(getComputedStyle(card).getPropertyValue('--cycle')) * 1000;
    card.getAnimations({ subtree: true }).forEach((a) => {
      a.pause();
      const effect = a.effect as KeyframeEffect | null;
      const duration = Number(effect?.getTiming().duration ?? cycleMs) || cycleMs;
      a.currentTime = duration === cycleMs ? fraction * cycleMs : (fraction * cycleMs) % duration;
    });
  });
});
scrub.addEventListener('dblclick', () => {
  if (!scrubbing) return;
  scrubbing = false;
  scrubVal.textContent = 'live';
  app.getAnimations({ subtree: true }).forEach((a) => a.play());
});
