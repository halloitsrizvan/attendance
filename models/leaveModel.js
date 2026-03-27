import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const leaveSchema = new Schema({
    ad: {
        type: Number,
        required: true
    },
    classNum: {
        type: Number,
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
    name: {
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
    teacher: {
        type: String
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
    academicYear: {
        type: String,
    },
    recovery: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.models['Leave'] || mongoose.model('Leave', leaveSchema);
