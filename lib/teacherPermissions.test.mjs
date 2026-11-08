import test from 'node:test';
import assert from 'node:assert/strict';
import { canApplyLeave } from './teacherPermissions.mjs';
test('Apply Leave is available to every role allowed by the page guard', () => {
  for (const role of ['class_teacher', 'super_admin', 'HOD', 'HOS', 'Principal', 'vice_principal', 'medical_teacher']) {
    assert.equal(canApplyLeave({ role: [role] }), true, role);
    assert.equal(canApplyLeave({ role }), true, role);
  }
});
test('ordinary teachers, unrelated roles and unloaded accounts do not see Apply Leave', () => {
  for (const teacher of [null, undefined, {}, { role: 'teacher' }, { role: ['teacher', 'CEPApproval'] }, { role: ['zehnuth_admin'] }]) assert.equal(canApplyLeave(teacher), false);
});
test('the existing super-admin test account retains access', () => {
  assert.equal(canApplyLeave({ email: 'test@gmail.com', role: ['teacher'] }), true);
});
