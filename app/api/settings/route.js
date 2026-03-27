import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Settings from '@/models/settingsModel';
import AcademicYear from '@/models/academicYearModel';

export async function GET() {
    await dbConnect();
    try {
        const settings = await Settings.find({});
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        // Fetch the currently active academic year
        const activeYear = await AcademicYear.findOne({ isActive: true });
        if (activeYear) {
            settingsMap.academicYear = activeYear.name;
        }

        return NextResponse.json(settingsMap);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    await dbConnect();
    try {
        const { key, value } = await request.json();
        const updatedSetting = await Settings.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        return NextResponse.json({ success: true, updatedSetting });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
