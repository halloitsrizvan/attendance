import dbConnect from "@/lib/mongodb";
import Leave from "@/models/leaveModel";
import Student from "@/models/studentsModel";
import Teacher from "@/models/teachersModel";
import { NextResponse } from "next/server";
import { getActiveAcademicYearId } from "@/lib/getActiveAcademicYear";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const ad = searchParams.get('ad');
  const status = searchParams.get('status');

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

    if (status) {
      const statusList = status.split(',');
      query.status = { $in: statusList };
    }

    const activeYearId = await getActiveAcademicYearId();
    if (activeYearId && searchParams.get('all') !== 'true') {
      query.academicYearId = activeYearId;
    }

    const leaves = await Leave.find(query)
      .populate('studentId')
      .populate('teacherId')
      .sort({ createdAt: -1 });
    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const activeYearId = await getActiveAcademicYearId();
    if (!body.academicYearId && activeYearId) {
      body.academicYearId = activeYearId;
    }
    const newLeave = await Leave.create(body);
    return NextResponse.json(newLeave);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
