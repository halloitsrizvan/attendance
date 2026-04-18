import dbConnect from "@/lib/mongodb";
import ClassExcusedPass from "@/models/shortLeaveModel";
import Student from "@/models/studentsModel";
import Teacher from "@/models/teachersModel";
import { NextResponse } from "next/server";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const ad = searchParams.get('ad');

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

    const passes = await ClassExcusedPass.find(query)
      .populate('studentId')
      .populate('teacherId')
      .sort({ createdAt: -1 });
    return NextResponse.json(passes);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const newPass = await ClassExcusedPass.create(body);
    return NextResponse.json(newPass);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
