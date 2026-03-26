import React from 'react';
import Header from '@/components/Header/Header';
import LeaveForm from '@/components/leave/LeaveForm';
import dbConnect from '@/lib/mongodb';
import StudentModel from '@/models/studentsModel';
import LeaveModel from '@/models/leaveModel';

// Always fetch fresh data on the server side for accurate leave allocations
export const revalidate = 0;

export default async function LeaveFormMain() {
  await dbConnect();
  
  // Pre-fetch all students with strict projection to keep the payload tiny
  const studentsRaw = await StudentModel.find({})
    .select({
      ADNO: 1,
      SL: 1,
      CLASS: 1,
      "SHORT NAME": 1,
      "FULL NAME": 1
    })
    .lean();
  
  const students = JSON.parse(JSON.stringify(studentsRaw));

  // Pre-fetch all current leaves safely
  const leavesRaw = await LeaveModel.find({}).sort({ createdAt: -1 }).lean();
  const leaves = JSON.parse(JSON.stringify(leavesRaw));

  return (
    <div>
        <Header/>
        <LeaveForm initialStudents={students} initialLeaves={leaves} />
    </div>
  );
}
