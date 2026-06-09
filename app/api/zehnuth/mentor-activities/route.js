import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import MentorActivity from '@/models/mentorActivityModel';
import AcademicYear from '@/models/academicYearModel';
import Teacher from '@/models/teachersModel';

export async function GET(req) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(req.url);
        const mentorId = searchParams.get('mentorId');
        
        let query = {};
        if (mentorId) {
            query.mentorId = mentorId;
        }

        const activities = await MentorActivity.find(query)
            .populate('mentorId', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json(activities);
    } catch (error) {
        console.error("Error fetching mentor activities:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        
        const body = await req.json();
        const { mentorId, activityTitle, description, imageUrl } = body;

        if (!mentorId || !activityTitle || !description) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get active academic year
        const activeYear = await AcademicYear.findOne({ isCurrent: true });

        const newActivity = new MentorActivity({
            mentorId,
            activityTitle,
            description,
            imageUrl: imageUrl || null,
            status: 'pending',
            points: 0,
            academicYearId: activeYear ? activeYear._id : null
        });

        await newActivity.save();

        return NextResponse.json(newActivity, { status: 201 });
    } catch (error) {
        console.error("Error creating mentor activity:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
