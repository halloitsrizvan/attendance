import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_UI_ROUTES, showsTeacherDock, usesCollegeTheme } from './uiTheme.mjs';

test('admin pages and their nested routes keep the existing UI', () => {
  for (const route of ADMIN_UI_ROUTES) {
    assert.equal(usesCollegeTheme(route), false, route);
    assert.equal(usesCollegeTheme(`${route}/details`), false, route);
    assert.equal(showsTeacherDock(route), false, route);
  }
});
test('teacher and student daily workflows receive the shared theme', () => {
  for (const route of ['/', '/attendance/4', '/leave-form', '/leave-dashboard', '/zehnuth/submit-point', '/students-portal', '/students-portal/attendance', '/students-portal/leave', '/login', '/students-login']) {
    assert.equal(usesCollegeTheme(route), true, route);
  }
});
test('teacher dock is omitted on home, attendance marking, auth and student screens', () => {
  for (const route of ['/', '/attendance', '/attendance/1', '/attendance/4', '/leave-form', '/login', '/signup', '/students-login', '/student', '/students-portal', '/students-portal/leave']) assert.equal(showsTeacherDock(route), false, route);
  for (const route of ['/leave-dashboard', '/zehnuth/submit-point']) assert.equal(showsTeacherDock(route), true, route);
});
test('route matching respects segment boundaries', () => {
  assert.equal(usesCollegeTheme('/report-example'), true);
  assert.equal(usesCollegeTheme('/students-portal/controls-guide'), true);
});
