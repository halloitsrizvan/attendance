import dbConnect from "@/lib/mongodb";
import Leave from "@/models/leaveModel";
import { NextResponse } from "next/server";
import { getActiveAcademicYearId } from "@/lib/getActiveAcademicYear";

export async function GET(req, { params }) {
  await dbConnect();
  try {
    const { ad } = params;
    const activeYearId = await getActiveAcademicYearId();
    const query = {
      ad: Number(ad),
      status: { $ne: 'returned' }
    };
    if (activeYearId) {
      query.academicYearId = activeYearId;
    }
    
    // Sort by createdAt descending to get the most recent leave first
    const leaves = await Leave.find(query).sort({ createdAt: -1 });

    if (!leaves || leaves.length === 0) {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}