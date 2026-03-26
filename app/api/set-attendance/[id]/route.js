import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/attendanceModel";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  const attendance = await Attendance.findById(params.id);
  if (!attendance) {
    return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
  }
  return NextResponse.json(attendance);
}

export async function DELETE(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  const attendance = await Attendance.findByIdAndDelete(params.id);
  if (!attendance) {
    return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
  }
  return NextResponse.json(attendance);
}

export async function PATCH(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  try {
    const body = await req.json();
    const attendance = await Attendance.findByIdAndUpdate(params.id, { $set: body }, { new: true });
    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }
    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}