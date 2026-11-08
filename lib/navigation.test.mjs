import test from 'node:test';
import assert from 'node:assert/strict';
import { clientNavigationDestination } from './navigation.mjs';

const current = 'https://college.example/attendance/3?date=2026-11-08';

test('internal pages preserve their query and hash', () => {
  assert.equal(clientNavigationDestination('/edit-attendance/3?date=2026-11-04&period=2#students', current), '/edit-attendance/3?date=2026-11-04&period=2#students');
});
test('same-page, anchor and external links keep native behaviour', () => {
  for (const href of [current, '#students', 'https://other.example', 'mailto:office@example.com', 'tel:12345']) assert.equal(clientNavigationDestination(href, current), null, href);
});
test('modified clicks, new tabs, downloads and cancelled clicks are not intercepted', () => {
  for (const options of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { target: '_blank' }, { download: '' }, { defaultPrevented: true }]) assert.equal(clientNavigationDestination('/leave-form', current, options), null);
});
test('query-only navigation still receives transition feedback', () => {
  assert.equal(clientNavigationDestination('?date=2026-11-04', current), '/attendance/3?date=2026-11-04');
});
