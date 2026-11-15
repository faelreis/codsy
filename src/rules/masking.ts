export function maskMatch(value: string): string {
  if (value.length <= 4) return '*'.repeat(value.length);
  const visible = 2;
  const starCount = Math.max(value.length - visible * 2, 3);
  return `${value.slice(0, visible)}${'*'.repeat(starCount)}${value.slice(-visible)}`;
}
