import dbConnect from "@/lib/mongodb";
import ClassExcusedPass from "@/models/shortLeaveModel";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    const passes = await ClassExcusedPass.find({}).sort({ createdAt: -1 });
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
