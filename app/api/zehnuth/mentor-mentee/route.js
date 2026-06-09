import dbConnect from "@/lib/mongodb";
import MentorMentee from "@/models/mentorMenteeModel";
import Student from "@/models/studentsModel";
import Teacher from "@/models/teachersModel";
import { NextResponse } from "next/server";

export async function GET(req) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get('mentorId');
    const studentId = searchParams.get('studentId');

    if (!mentorId && !studentId) {
        return NextResponse.json({ error: "Mentor ID or Student ID is required" }, { status: 400 });
    }

    try {
        let query = { isActive: true };
        if (mentorId) query.mentorId = mentorId;
        if (studentId) query.menteeId = studentId;

        const relations = await MentorMentee.find(query)
            .populate({
                path: 'mentorId',
                select: { "name": 1, "EMAIL": 1 }
            })
            .populate({
                path: 'menteeId',
                select: { "SHORT NAME": 1, "FULL NAME": 1, "ADNO": 1, "CLASS": 1 }
            });
        
        return NextResponse.json(relations);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
