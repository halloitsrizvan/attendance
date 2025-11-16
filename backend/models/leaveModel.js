const mongoose = require('mongoose');

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
        required: true
    },
    toTime: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Scheduled','pending', 'active', 'late', 'returned'],
        default: "Scheduled"
    },
    teacher: {
        type: String
    },
    returnedAt: {
        type: Date,
        default: null
    },
    leaveStartTeacher:{
        type: String
    },markReturnedTeacher:{
        type: String
    },
    leaveType:{type:String}
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);