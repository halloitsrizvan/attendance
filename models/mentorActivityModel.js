const mongoose = require('mongoose');

const mentorActivitySchema = new mongoose.Schema({
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    activityTitle: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    imageUrl: {
        type: String,
        default: null
    },
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    }
}, { timestamps: true });

module.exports = mongoose.models.MentorActivity || mongoose.model('MentorActivity', mentorActivitySchema);
