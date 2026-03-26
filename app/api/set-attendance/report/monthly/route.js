import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/attendanceModel";
import { NextResponse } from "next/server";

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const classNum = searchParams.get('class');

    if (!month || !year) {
      return NextResponse.json({ error: 'month and year are required' }, { status: 400 });
    }

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 1);

    const matchFilter = {
      attendanceDate: { $gte: startDate, $lt: endDate }
    };
    if (classNum) {
      matchFilter.class = parseInt(classNum, 10);
    }

    const report = await Attendance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { ad: "$ad", class: "$class" },
          name: { $first: "$nameOfStd" },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id.class": 1, "_id.ad": 1 } }
    ]);

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
