import dbConnect from "@/lib/mongodb";
import Classes from "@/models/classes";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  const cls = await Classes.findById(params.id);
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  return NextResponse.json(cls);
}

export async function DELETE(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  const cls = await Classes.findByIdAndDelete(params.id);
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  return NextResponse.json(cls);
}

export async function PATCH(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  try {
    const body = await req.json();
    const cls = await Classes.findByIdAndUpdate(params.id, { $set: body }, { new: true });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    return NextResponse.json(cls);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}