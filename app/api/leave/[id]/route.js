import dbConnect from "@/lib/mongodb";
import Leave from "@/models/leaveModel";
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
    const leave = await Leave.findByIdAndUpdate(params.id, { $set: body }, { new: true });
    if (!leave) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    }
    return NextResponse.json(leave);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  return PATCH(req, { params });
}