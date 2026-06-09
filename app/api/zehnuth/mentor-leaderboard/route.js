import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MentorActivity from '@/models/mentorActivityModel';
import Teacher from '@/models/teachersModel';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        const activities = await MentorActivity.find({ status: 'approved' })
            .populate('mentorId', 'name')
            .lean();

        // Aggregate points per mentor
        const mentorMap = {};

        activities.forEach(act => {
            if (!act.mentorId) return;
            const id = act.mentorId._id.toString();
            if (!mentorMap[id]) {
                mentorMap[id] = {
                    id,
                    name: act.mentorId.name,
                    points: 0,
                    activities: 0
                };
            }
            mentorMap[id].points += act.points;
            mentorMap[id].activities += 1;
        });

        const leaderboard = Object.values(mentorMap).sort((a, b) => b.points - a.points);

        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error("Error fetching mentor leaderboard:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
