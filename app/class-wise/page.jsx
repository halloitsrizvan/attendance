import React from 'react';
import Header from '@/components/Header/Header';
import ClassWIse from '@/components/class-wise/ClassWIse';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/attendanceModel';
import ClassModel from '@/models/classes';

import StudentModel from '@/models/studentsModel';
import LeaveModel from '@/models/leaveModel';

// Cache the results for 60 seconds (ISR)
export const revalidate = 60;

export default async function ClassWIsePriv() {
  await dbConnect();
  
  // 1. Get real student count (233)
  const allStudents = await StudentModel.countDocuments({ active: { $ne: false } });

  // 2. Fetch classes for analysis cards
  const classesRaw = await ClassModel.find({}).sort({ class: 1 }).lean();
  const classes = JSON.parse(JSON.stringify(classesRaw));

  // 3. Fetch latest absentees from manual attendance using a robust pipeline
  const latestAbsenteesPipeline = [
    { $sort: { attendanceDate: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$studentId", 
        latestRecord: { $first: "$$ROOT" }
      }
    },
    { $replaceRoot: { newRoot: "$latestRecord" } },
    { $match: { status: "Absent" } },
    // Join with Student data to get ADNO and Name
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo"
      }
    },
    { $unwind: "$studentInfo" },
    {
      $project: {
        _id: 1,
        ad: "$studentInfo.ADNO",
        nameOfStd: "$studentInfo.SHORT NAME",
        class: "$studentInfo.CLASS",
        status: 1,
        attendanceDate: 1,
        createdAt: 1
      }
    },
    { $sort: { class: -1, ad: 1 } }
  ];
  
  const absenteesRaw = await Attendance.aggregate(latestAbsenteesPipeline);
  const manualAbsentees = JSON.parse(JSON.stringify(absenteesRaw));

  // 4. Fetch today's leaves
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const leavesRaw = await LeaveModel.find({
    status: { $in: ['active', 'Scheduled', 'late'] },
    fromDate: { $lte: todayStr } // Only starting today or in the past
  }).populate('studentId').lean();
  
  const leaves = JSON.parse(JSON.stringify(leavesRaw));
  
  // 5. Merge Manual and Leave absentees
  const absenteeMap = {};
  
  // Initial fill from manual attendance
  manualAbsentees.forEach(a => {
    if (a.ad) {
      absenteeMap[a.ad] = a;
    }
  });

  // Override/Add from leaves
  leaves.forEach(l => {
    const ad = l.studentId?.ADNO || l.ad;
    if (ad) {
      // If leave is 'late', we only add if no attendance record exists or if this is more recent
      const existing = absenteeMap[ad];
      const leaveDate = new Date(l.updatedAt || l.createdAt);
      const existingDate = existing ? new Date(existing.createdAt) : new Date(0);

      if (!existing || leaveDate > existingDate) {
        absenteeMap[ad] = {
          ad: ad,
          nameOfStd: l.studentId?.['SHORT NAME'] || l.studentId?.['FULL NAME'] || l.name,
          class: l.studentId?.CLASS || l.classNum,
          status: "Absent",
          displayStatus: l.status,
          attentenceDate: l.fromDate,
          createdAt: l.createdAt || l.updatedAt
        };
      }
    }
  });

  const abseties = Object.values(absenteeMap).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
        <Header/>
        <ClassWIse 
          initialClasses={classes} 
          initialAbseties={abseties} 
          initialAllStudents={allStudents} 
        />
    </div>
  );
}
