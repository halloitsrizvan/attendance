import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../utils/leaveReturnUtils.js', import.meta.url), 'utf8');
const { isFridayReturnWithinDeadline, canTeacherReturnLeave } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const teacher = { role: ['teacher'] };
test('Friday permission follows India midnight boundaries', () => {
 assert.equal(isFridayReturnWithinDeadline({}, new Date('2026-11-12T18:29:59Z')), false);
 assert.equal(isFridayReturnWithinDeadline({}, new Date('2026-11-12T18:30:00Z')), true);
 assert.equal(isFridayReturnWithinDeadline({}, new Date('2026-11-13T18:29:59Z')), true);
 assert.equal(isFridayReturnWithinDeadline({}, new Date('2026-11-13T18:30:00Z')), false);
});
test('all teachers can return older late leaves during Friday only', () => {
 const params = {teacher, leave:{toDate:'2026-11-10',toTime:'19:00'},isLate:true,studentClass:5};
 assert.equal(canTeacherReturnLeave({...params,now:new Date('2026-11-13T16:00:00Z')}), true);
 assert.equal(canTeacherReturnLeave({...params,now:new Date('2026-11-13T18:30:00Z')}), false);
 assert.equal(canTeacherReturnLeave({...params,teacher:{role:['super_admin']},now:new Date('2026-11-14T10:00:00Z')}), true);
});
test('normal on-time returns remain available and missing teachers are rejected',()=>{
 assert.equal(canTeacherReturnLeave({teacher,isLate:false}),true);
 assert.equal(canTeacherReturnLeave({teacher:null,isLate:true,now:new Date('2026-11-13T10:00:00Z')}),false);
});
