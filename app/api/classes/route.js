import dbConnect from "@/lib/mongodb";
import Classes from "@/models/classes";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    const classes = await Classes.find({}).sort({ class: 1 });
    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const newClass = await Classes.create(body);
    return NextResponse.json(newClass);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
