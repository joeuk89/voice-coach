// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { exampleChips } from './example-chips';

function render(examples?: string[]): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = exampleChips(examples);
  return container;
}

describe('exampleChips', () => {
  it('renders one chip per example after a hidden lead', () => {
    const row = render(['brrr-ine', 'brrr-awn']).querySelector('.examples')!;
    expect([...row.querySelectorAll('.chip')].map((c) => c.textContent)).toEqual(['brrr-ine', 'brrr-awn']);
    expect(row.querySelector('.visually-hidden')?.textContent).toBe('Examples: ');
  });

  it('renders no row without examples', () => {
    expect(render().innerHTML).toBe('');
    expect(render([]).innerHTML).toBe('');
  });

  it('escapes the example text', () => {
    expect(render(['<b>']).querySelector('.chip')!.innerHTML).toBe('&lt;b&gt;');
  });
});
