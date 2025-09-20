const mongoose = require('mongoose');

const Schema = mongoose.Schema

const classSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    class: {
        type: Number,
        required: true
    },
    totalStudents: {
        type: Number,
        required: true
    },
    presentStudents: {
        type: Number,
        required: true
    },
    absentStudents: {
        type: Number,
        required: true
    },
    percentage: {
        type: String,
        required: true
    }
},{timestamps:true})

module.exports = mongoose.model('Class',classSchema);