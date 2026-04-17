import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/attendanceModel";
import Student from "@/models/studentsModel";
import Teacher from "@/models/teachersModel";
import { NextResponse } from "next/server";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const ad = searchParams.get('ad');
  const classNumber = searchParams.get('classNumber');
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const period = searchParams.get('period');

  try {
    let query = {};
    if (ad) {
      const student = await Student.findOne({ ADNO: Number(ad) });
      if (student) {
        query.studentId = student._id;
      } else {
        return NextResponse.json([]);
      }
    }
    if (classNumber) query.classNumber = Number(classNumber);
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0,0,0,0);
      const endDate = new Date(date);
      endDate.setHours(23,59,59,999);
      query.attendanceDate = { $gte: startDate, $lte: endDate };
    }
    if (time) query.attendanceTime = time;
    if (period) query.period = Number(period);

    const attendance = await Attendance.find(query)
      .populate('studentId')
      .populate('teacherId')
      .sort({ createdAt: -1 })
      .limit(500);
    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const attendance = await Attendance.create(body);
    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(req) {
  await dbConnect();
  try {
    const { updates } = await req.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Updates should be an array" }, { status: 400 });
    }
    
    const bulkOps = updates.map((student) => ({
      updateOne: {
        filter: { _id: student._id },
        update: { $set: { status: student.status } },
      },
    }));
    
    await Attendance.bulkWrite(bulkOps);
    
    return NextResponse.json({ message: "Attendance updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
