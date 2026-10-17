import { describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../state/settings';
import { bindRoutineToggle, routineToggle } from './routine-toggle';

function fakeButton(routine: string) {
  let onClick: (() => void) | undefined;
  return {
    dataset: { routine },
    addEventListener: (_event: string, handler: () => void) => {
      onClick = handler;
    },
    click: () => onClick?.(),
  };
}

function mount(routines: string[]) {
  const buttons = routines.map(fakeButton);
  const root = { querySelectorAll: () => buttons } as unknown as ParentNode;
  const settings = defaultSettings();
  const onChange = vi.fn();
  bindRoutineToggle(root, settings, onChange);
  return { buttons, settings, onChange };
}

describe('routineToggle', () => {
  it('marks only the current routine as pressed, inside a named group', () => {
    const html = routineToggle({ ...defaultSettings(), routine: 'short' }, 'Routine');
    expect(html).toContain('role="group" aria-label="Routine"');
    expect(html).toMatch(/data-routine="short"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/data-routine="full"[^>]*aria-pressed="false"/);
    expect(html).not.toContain('role="radio"');
  });
});

describe('bindRoutineToggle', () => {
  it('sets the tapped routine, then reports the change', () => {
    const { buttons, settings, onChange } = mount(['short', 'full']);
    buttons[0]!.click();
    expect(settings.routine).toBe('short');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('ignores a button with an unknown routine', () => {
    const { buttons, settings, onChange } = mount(['weekly']);
    buttons[0]!.click();
    expect(settings.routine).toBe('full');
    expect(onChange).not.toHaveBeenCalled();
  });
});
