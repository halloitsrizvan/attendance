const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const shortLeaveSchema = new Schema({
    ad: {
        type: Number,
        required: true
    },
    classNum: {
        type: Number,
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
    toTime: {
        type: String,
        required: true
    },
    date:{type:Date},
    teacher: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('ClassExcusedPass', shortLeaveSchema);