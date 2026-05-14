import dbConnect from "@/lib/mongodb";
import Points from "@/models/pointsModel";
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
        const { id, status, points, approved, mentorApproved, imageUrl } = body;

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const updatedPoint = await Points.findByIdAndUpdate(
            id,
            { status, points, approved, mentorApproved, imageUrl },
            { new: true }
        );

        if (!updatedPoint) return NextResponse.json({ error: "Record not found" }, { status: 404 });

        return NextResponse.json(updatedPoint);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
