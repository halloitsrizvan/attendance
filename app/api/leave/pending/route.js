import dbConnect from "@/lib/mongodb";
import Leave from "@/models/leaveModel";
import { NextResponse } from "next/server";
import { getActiveAcademicYearId } from "@/lib/getActiveAcademicYear";

export async function GET() {
  await dbConnect();
  try {
    const activeYearId = await getActiveAcademicYearId();
    const query = { status: "pending" };
    if (activeYearId) {
      query.academicYearId = activeYearId;
    }
    const leaves = await Leave.find(query).sort({ createdAt: -1 });
    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
