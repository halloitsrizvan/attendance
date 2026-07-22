import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const programSchema = new Schema({
    category: {
        type: String,
        required: false,
        default: 'Internal'
    },
    programType: {
        type: String,
        enum: ['Curriculum', 'Co-Curriculum', 'Extra-Curriculum'],
        default: 'Curriculum'
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    tier: {
        type: String,
        enum: ['Tier 1', 'Tier 2'],
        default: 'Tier 1'
    },
    targetAudience: {
        type: String
    },
    objectives: {
        type: String
    },
    participantsCount: {
        type: Number
    },
    venue: {
        type: String
    },
    guestName: {
        type: String
    },
    mark: {
        type: Number,
        default: 0
    },
    poster: {
        type: String
    },
    gallery: [{
        type: String
    }],
    date: {
        type: String
    },
    rejected: {
        type: Boolean,
        default: false
    },
    collaboration: {
        type: String
    },
    isDraft: {
        type: Boolean,
        default: false
    }
});

const classReportSchema = new Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: false
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: false
    },
    submitterType: {
        type: String,
        enum: ['teacher', 'student'],
        default: 'teacher'
    },
    month: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    classNumber: {
        type: Number,
        required: true
    },
    section: {
        type: String,
        required: true,
        enum: ['Junior', 'Senior', 'Super-Senior']
    },
    programs: [programSchema],
    totalMark: {
        type: Number,
        default: 0
    },
    programPoints: {
        type: Number,
        default: 0
    },
    tier1Points: {
        type: Number,
        default: 0
    },
    tier2Points: {
        type: Number,
        default: 0
    },
    originalZehnuthPoints: {
        type: Number,
        default: 0
    },
    zehnuthPoints: {
        type: Number,
        default: 0
    },
    vivaPoints: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: 'pending' // pending, reviewed
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    reviewedAt: {
        type: Date
    },
    classTeacherApproved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

if (process.env.NODE_ENV !== 'production') {
    delete mongoose.models.ClassReport;
}

export default mongoose.models.ClassReport || mongoose.model('ClassReport', classReportSchema);
