import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const leaveSchema = new Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    fromDate: {
        type: String,
        required: true
    },
    fromTime: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    toDate: {
        type: String,
    },
    toTime: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Scheduled', 'pending', 'active', 'late', 'returned'],
        default: "Scheduled"
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    returnedAt: {
        type: Date,
        default: null
    },
    leaveStartTeacher: {
        type: String
    },
    markReturnedTeacher: {
        type: String
    },
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    },
    recovery: {
        type: Boolean,
        default: false
    },
    approved: {
        type: Boolean,
        default: true
    },
    reasonHistory: [
        {
            reason: String,
            timestamp: { type: Date, default: Date.now },
            teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
        }
    ],
    extensionHistory: [
        {
            previousToDate: String,
            previousToTime: String,
            newToDate: String,
            newToTime: String,
            timestamp: { type: Date, default: Date.now },
            teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
        }
    ]
}, { timestamps: true });

export default mongoose.models['Leave'] || mongoose.model('Leave', leaveSchema);
