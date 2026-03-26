import dbConnect from "@/lib/mongodb";
import Teacher from "@/models/teachersModel";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export async function GET(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  const teacher = await Teacher.findById(params.id).select("-password");
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }
  return NextResponse.json(teacher);
}

export async function DELETE(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  const teacher = await Teacher.findByIdAndDelete(params.id);
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }
  return NextResponse.json(teacher);
}

export async function PATCH(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  try {
    const body = await req.json();
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      body.password = await bcrypt.hash(body.password, salt);
    }
    const teacher = await Teacher.findByIdAndUpdate(params.id, { $set: body }, { new: true }).select("-password");
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }
    return NextResponse.json(teacher);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}