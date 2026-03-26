import dbConnect from "@/lib/mongodb";
import Minus from "@/models/minusModel";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "No such document found" }, { status: 404 });
  }
  const minus = await Minus.findById(params.id);
  if (!minus) {
    return NextResponse.json({ error: "No such document found" }, { status: 404 });
  }
  return NextResponse.json(minus);
}

export async function DELETE(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "No such document found" }, { status: 404 });
  }
  const minus = await Minus.findByIdAndDelete(params.id);
  if (!minus) {
    return NextResponse.json({ error: "No such document found" }, { status: 404 });
  }
  return NextResponse.json(minus);
}

export async function PATCH(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "No such document found" }, { status: 404 });
  }
  try {
    const body = await req.json();
    const minus = await Minus.findByIdAndUpdate({ _id: params.id }, { ...body }, { new: true });
    if (!minus) {
      return NextResponse.json({ error: "No such document found" }, { status: 404 });
    }
    return NextResponse.json(minus);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}