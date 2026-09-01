import dbConnect from "@/lib/mongodb";
import Leave from "@/models/leaveModel";
import { NextResponse } from "next/server";
import { getActiveAcademicYearId } from "@/lib/getActiveAcademicYear";

export async function GET() {
  await dbConnect();
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeYearId = await getActiveAcademicYearId();
    const query = {
      fromDate: { $lte: today.toISOString() },
      $or: [
        { toDate: { $gte: today.toISOString() } },
        { toDate: null }
      ]
    };
    if (activeYearId) {
      query.academicYearId = activeYearId;
    }

    const leaves = await Leave.find(query).sort({ createdAt: -1 });

    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
