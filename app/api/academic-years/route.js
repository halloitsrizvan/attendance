import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AcademicYear from '@/models/academicYearModel';

// List and Create
export async function GET() {
    await dbConnect();
    try {
        const years = await AcademicYear.find({}).sort({ createdAt: -1 });
        return NextResponse.json(years);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    await dbConnect();
    try {
        const { name } = await request.json();
        const newYear = await AcademicYear.create({ name });
        return NextResponse.json({ success: true, newYear });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Global activate logic (use PATCH)
export async function PATCH(request) {
    await dbConnect();
    try {
        const { id, activate } = await request.json();
        
        if (activate) {
            // Deactivate all others first
            await AcademicYear.updateMany({}, { isActive: false });
            // Set this one active
            const updated = await AcademicYear.findByIdAndUpdate(id, { isActive: true }, { new: true });
            return NextResponse.json({ success: true, updated });
        } else {
             // Just deactivate this one
            const updated = await AcademicYear.findByIdAndUpdate(id, { isActive: false }, { new: true });
            return NextResponse.json({ success: true, updated });
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
