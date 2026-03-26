import dbConnect from "@/lib/mongodb";
import Leave from "@/models/leaveModel";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  await dbConnect();
  try {
    const { ad } = params;
    
    // Sort by createdAt descending to get the most recent leave first
    const leaves = await Leave.find({
      ad: Number(ad),
      status: { $ne: 'returned' }
    }).sort({ createdAt: -1 });

    if (!leaves || leaves.length === 0) {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
