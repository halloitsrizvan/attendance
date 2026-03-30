import dbConnect from "@/lib/mongodb";
import Minus from "@/models/minusModel";
import Student from "@/models/studentsModel";
import Teacher from "@/models/teachersModel";
import { NextResponse } from "next/server";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const ad = searchParams.get('ad');

  try {
    let query = {};
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }
    if (ad) {
      const student = await Student.findOne({ ADNO: Number(ad) });
      if (student) {
        query.studentId = student._id;
      } else {
        return NextResponse.json([]);
      }
    }
    const minus = await Minus.find(query)
      .populate('studentId')
      .populate('teacherId')
      .sort({ createdAt: -1 });
    return NextResponse.json(minus);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const minus = await Minus.create(body);
    return NextResponse.json(minus);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
