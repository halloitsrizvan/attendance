import dbConnect from "@/lib/mongodb";
import Leave from "@/models/leaveModel";
import OffDay from "@/models/offDayModel";
import Student from "@/models/studentsModel";
import { getActiveLeaveDays } from "@/lib/recovery";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  const leave = await Leave.findById(params.id);
  if (!leave) {
    return NextResponse.json({ error: "Leave not found" }, { status: 404 });
  }
  return NextResponse.json(leave);
}

export async function DELETE(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  const leave = await Leave.findByIdAndDelete(params.id);
  if (!leave) {
    return NextResponse.json({ error: "Leave not found" }, { status: 404 });
  }
  return NextResponse.json(leave);
}

export async function PATCH(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  try {
    const body = await req.json();
    
    // Automatic Recovery Logic
    if (body.status === 'returned') {
        const existingLeave = await Leave.findById(params.id);
        if (existingLeave) {
            const student = await Student.findById(existingLeave.studentId);
            const offDays = await OffDay.find({});
            const returnedAt = body.returnedAt || new Date().toISOString();
            
            const leaveDays = getActiveLeaveDays(
                existingLeave.fromDate, 
                existingLeave.fromTime, 
                returnedAt, 
                student?.CLASS || existingLeave.classNum, 
                offDays
            );

            if (leaveDays === 0) {
                body.recovery = true; // Auto-clear recovery if it's on an off-day
            }
        }
    }

    const leave = await Leave.findByIdAndUpdate(params.id, { $set: body }, { new: true });
    if (!leave) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    }
    return NextResponse.json(leave);
  } catch (error) {
    console.error("Leave Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  return PATCH(req, { params });
}