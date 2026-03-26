import dbConnect from "@/lib/mongodb";
import Leave from "@/models/leaveModel";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    const leaves = await Leave.find({ status: "pending" }).sort({ createdAt: -1 });
    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
