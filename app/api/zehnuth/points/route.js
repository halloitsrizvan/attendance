import dbConnect from "@/lib/mongodb";
import Points from "@/models/pointsModel";
import Student from "@/models/studentsModel";
import Teacher from "@/models/teachersModel";
import MentorMentee from "@/models/mentorMenteeModel";
import { NextResponse } from "next/server";

export async function POST(req) {
    await dbConnect();
    try {
        const body = await req.json();
        // body should contain studentId, mentorId, activity, category, points, academicYearId
        const newPoint = await Points.create(body);
        return NextResponse.json(newPoint);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function GET(req) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const mentorId = searchParams.get('mentorId');

    try {
        let query = {};
        if (studentId) query.studentId = studentId;
        if (mentorId) query.mentorId = mentorId;

        const status = searchParams.get('status');
        if (status) query.status = status;

        if (searchParams.get('leaderboard')) {
            const leaderboard = await Points.aggregate([
                { $match: { status: 'approved' } },
                {
                    $group: {
                        _id: '$studentId',
                        totalPoints: { $sum: '$points' },
                        achievementCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'students',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'student'
                    }
                },
                { $unwind: '$student' },
                {
                    $lookup: {
                        from: 'mentormentees',
                        localField: '_id',
                        foreignField: 'menteeId',
                        as: 'mentorRelation'
                    }
                },
                {
                    $unwind: {
                        path: '$mentorRelation',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'teachers',
                        localField: 'mentorRelation.mentorId',
                        foreignField: '_id',
                        as: 'mentor'
                    }
                },
                {
                    $unwind: {
                        path: '$mentor',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        mentorName: '$mentor.name'
                    }
                },
                { $sort: { totalPoints: -1 } },
                { $limit: 100 }
            ]);
            return NextResponse.json(leaderboard);
        }

        const points = await Points.find(query)
            .populate('studentId', { "SHORT NAME": 1, "FULL NAME": 1, "ADNO": 1, "CLASS": 1 })
            .populate('mentorId', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json(points);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function PUT(req) {
    await dbConnect();
    try {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        // Ensure imageUrl is in schema (Next.js dev mode fix)
        if (!Points.schema.path('imageUrl')) {
            Points.schema.add({ imageUrl: { type: String, default: null } });
        }

        // Filter out undefined values
        const cleanUpdate = {};
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                cleanUpdate[key] = updateData[key];
            }
        });

        console.log("Updating point record:", id, cleanUpdate);

        const updatedPoint = await Points.findByIdAndUpdate(
            id,
            { $set: cleanUpdate },
            { new: true }
        );

        if (!updatedPoint) return NextResponse.json({ error: "Record not found" }, { status: 404 });

        return NextResponse.json(updatedPoint);
    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
