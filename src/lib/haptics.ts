export function buzz(pattern: number | number[] = [120, 80, 160]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Not supported or blocked.
  }
}
