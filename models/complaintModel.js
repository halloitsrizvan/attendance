import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    attendanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendance',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    actualStatus: {
        type: String,
        enum: ['Present', 'Leave', 'Other'],
        required: true
    },
    message: {
        type: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Resolved', 'Rejected'],
        default: 'Pending'
    },
    adminRemark: {
        type: String
    }
}, { timestamps: true });

export default mongoose.models['Complaint'] || mongoose.model('Complaint', complaintSchema);
