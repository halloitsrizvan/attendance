import dbConnect from "@/lib/mongodb";
import Leave from "@/models/leaveModel";
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
    const leaves = await Leave.find(query).sort({ createdAt: -1 });
    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const newLeave = await Leave.create(body);
    return NextResponse.json(newLeave);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
