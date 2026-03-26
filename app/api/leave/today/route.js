import dbConnect from "@/lib/mongodb";
import Leave from "@/models/leaveModel";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const leaves = await Leave.find({
      fromDate: { $lte: today.toISOString() },
      $or: [
        { toDate: { $gte: today.toISOString() } },
        { toDate: null }
      ]
    }).sort({ createdAt: -1 });

    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
