import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/attendanceModel";
import { NextResponse } from "next/server";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const ad = searchParams.get('ad');

  try {
    let query = {};
    if (ad) {
      query.ad = ad;
    }
    const attendance = await Attendance.find(query).sort({ createdAt: -1 });
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
