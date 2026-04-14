import dbConnect from "@/lib/mongodb";
import ClassExcusedPass from "@/models/shortLeaveModel";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  const pass = await ClassExcusedPass.findById(params.id);
  if (!pass) {
    return NextResponse.json({ error: "Pass not found" }, { status: 404 });
  }
  return NextResponse.json(pass);
}

export async function DELETE(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  const pass = await ClassExcusedPass.findByIdAndDelete(params.id);
  if (!pass) {
    return NextResponse.json({ error: "Pass not found" }, { status: 404 });
  }
  return NextResponse.json(pass);
}

export async function PATCH(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  try {
    const body = await req.json();
    const pass = await ClassExcusedPass.findByIdAndUpdate(params.id, { $set: body }, { new: true });
    if (!pass) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }
    return NextResponse.json(pass);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  return PATCH(req, { params });
}