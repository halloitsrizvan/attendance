import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MentorActivity from '@/models/mentorActivityModel';

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        
        const { id } = params;
        const body = await req.json();
        
        const { points, status } = body;

        const updatedActivity = await MentorActivity.findByIdAndUpdate(
            id,
            { 
                ...(points !== undefined && { points: Number(points) }),
                ...(status && { status })
            },
            { new: true }
        );

        if (!updatedActivity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        return NextResponse.json(updatedActivity);
    } catch (error) {
        console.error("Error updating mentor activity:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
