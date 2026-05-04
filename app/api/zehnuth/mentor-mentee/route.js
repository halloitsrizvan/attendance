import dbConnect from "@/lib/mongodb";
import MentorMentee from "@/models/mentorMenteeModel";
import Student from "@/models/studentsModel";
import { NextResponse } from "next/server";

export async function GET(req) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get('mentorId');

    if (!mentorId || mentorId === 'undefined' || mentorId === 'null') {
        return NextResponse.json({ error: "Valid Mentor ID is required" }, { status: 400 });
    }

    try {
        const relations = await MentorMentee.find({ mentorId, isActive: true })
            .populate({
                path: 'menteeId',
                select: { "SHORT NAME": 1, "FULL NAME": 1, "ADNO": 1, "CLASS": 1 }
            });
        
        return NextResponse.json(relations);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
