export function clientNavigationDestination(href, currentHref, options = {}) {
  const { defaultPrevented, button = 0, metaKey, ctrlKey, shiftKey, altKey, download, target } = options;
  if (defaultPrevented || button !== 0 || metaKey || ctrlKey || shiftKey || altKey || download !== undefined || (target && target !== '_self') || typeof href !== 'string') return null;
  const current = new URL(currentHref);
  const next = new URL(href, current);
  if (next.origin !== current.origin || !['http:', 'https:'].includes(next.protocol)) return null;
  if (next.pathname === current.pathname && next.search === current.search) return null;
  return `${next.pathname}${next.search}${next.hash}`;
}
