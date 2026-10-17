function icon(paths: string): string {
  return `<svg class="icon" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}


export const icons = {
  chevronLeft: icon('<path d="M12.5 4.5 7 10l5.5 5.5"/>'),
  chevronDown: icon('<path d="m5 7.5 5 5 5-5"/>'),
  gear: icon(
    '<path d="M8.34 3.82L8.83 1.68L11.17 1.68L11.66 3.82L13.2 4.46L15.06 3.29L16.71 4.94L15.54 6.8L16.18 8.34L18.32 8.83L18.32 11.17L16.18 11.66L15.54 13.2L16.71 15.06L15.06 16.71L13.2 15.54L11.66 16.18L11.17 18.32L8.83 18.32L8.34 16.18L6.8 15.54L4.94 16.71L3.29 15.06L4.46 13.2L3.82 11.66L1.68 11.17L1.68 8.83L3.82 8.34L4.46 6.8L3.29 4.94L4.94 3.29L6.8 4.46Z"/><circle cx="10" cy="10" r="2.75"/>',
  ),
  check: icon('<path d="m4.5 10.5 3.5 3.5 7.5-8"/>'),
  reset: icon('<path d="M3.5 10a6.5 6.5 0 1 0 1.9-4.6L3.5 7.3"/><path d="M3.5 3.8v3.5H7"/>'),
};
