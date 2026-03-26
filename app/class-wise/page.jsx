import React from 'react';
import Header from '@/components/Header/Header';
import ClassWIse from '@/components/class-wise/ClassWIse';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/attendanceModel';
import ClassModel from '@/models/classes';

// Cache the results for 60 seconds (ISR)
export const revalidate = 60;

export default async function ClassWIsePriv() {
  await dbConnect();
  
  // Pre-fetch classes directly from DB
  const classesRaw = await ClassModel.find({}).sort({ class: 1 }).lean();
  const classes = JSON.parse(JSON.stringify(classesRaw));
  const allStudents = classes.reduce((sum, item) => sum + Number(item.presentStudents || 0), 0);

  // Use Aggregation Pipeline to offload the "latest absentees" computation to MongoDB!
  // This completely eliminates the bottleneck of sending 100k+ rows to the client.
  const latestAbsenteesPipeline = [
    { $sort: { attendanceDate: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$ad", 
        latestRecord: { $first: "$$ROOT" }
      }
    },
    { $replaceRoot: { newRoot: "$latestRecord" } },
    { $match: { status: "Absent" } },
    { $sort: { class: -1, SL: 1 } }
  ];
  
  const absenteesRaw = await Attendance.aggregate(latestAbsenteesPipeline);
  const abseties = JSON.parse(JSON.stringify(absenteesRaw));

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
