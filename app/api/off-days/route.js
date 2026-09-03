import dbConnect from "@/lib/mongodb";
import OffDay from "@/models/offDayModel";
import { NextResponse } from "next/server";
import { getActiveAcademicYearId } from "@/lib/getActiveAcademicYear";

export async function GET(req) {
    await dbConnect();
    try {
        const offDays = await OffDay.find({}).sort({ fromDate: 1 });
        return NextResponse.json(offDays);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { protectMutation } from "@/utils/mutationGuard";

export async function POST(req) {
    const mutationBlocked = protectMutation(req);
    if (mutationBlocked) return mutationBlocked;

    await dbConnect();
    try {
        const body = await req.json();
        const activeYearId = await getActiveAcademicYearId();
        if (!body.academicYearId && activeYearId) {
            body.academicYearId = activeYearId;
        }
        const offDay = await OffDay.create(body);
        return NextResponse.json(offDay);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(req) {
    const mutationBlocked = protectMutation(req);
    if (mutationBlocked) return mutationBlocked;

    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });
        
        await OffDay.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
