export function dockPosition(x, y, rect, count, padding = 4) {
  if (count < 1 || rect.width <= padding * 2 || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
  const slot = (rect.width - padding * 2) / count;
  const offset = (x - rect.left - padding) / slot;
  return {
    index: Math.max(0, Math.min(count - 1, Math.floor(offset))),
    position: Math.max(0, Math.min(count - 1, offset - .5)),
  };
}
