const mongoose = require('mongoose');

const pointsSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    activity: {
        type: String,
        required: true
    },
    category: {
        type: String, // e.g., 'Academic', 'Extracurricular', 'Behavior'
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approved: {
        type: Boolean,
        default: false
    },
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    }
}, { timestamps: true });

module.exports = mongoose.models.Points || mongoose.model('Points', pointsSchema);
