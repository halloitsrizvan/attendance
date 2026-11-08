import test from 'node:test';
import assert from 'node:assert/strict';
import { complaintMatchesClass, isComplaintAdmin } from './complaintRouting.mjs';

test('all complaint types belong to the student class teacher', () => {
  for (const actualStatus of ['Present', 'Leave', 'CEP', 'Other']) {
    assert.equal(complaintMatchesClass({ actualStatus, studentId: { CLASS: 3 } }, { classNum: 3 }), true);
  }
});
test('old assignments to attendance teachers or HOD do not hide class complaints', () => {
  assert.equal(complaintMatchesClass({ teacherId: 'other-teacher', studentId: { CLASS: 8 } }, { _id: 'class-teacher', classNum: 8 }), true);
});
test('teachers cannot match another class or an unassigned class', () => {
  for (const teacher of [{ classNum: 4 }, {}, { classNum: null }, { classNum: 0 }]) {
    assert.equal(complaintMatchesClass({ studentId: { CLASS: 3 } }, teacher), false);
  }
});
test('numeric and string class assignments match', () => {
  assert.equal(complaintMatchesClass({ studentId: { CLASS: '3' } }, { classNum: 3 }), true);
});
test('only a super_admin role grants the global view', () => {
  assert.equal(isComplaintAdmin({ role: ['teacher', 'super_admin'] }), true);
  assert.equal(isComplaintAdmin({ role: 'super_admin' }), true);
  for (const role of ['teacher', 'class_teacher', 'HOD', 'HOS', 'medical_teacher']) assert.equal(isComplaintAdmin({ role }), false);
});
