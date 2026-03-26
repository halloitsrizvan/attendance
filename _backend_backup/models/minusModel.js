const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const minusSchema = new Schema({
    ad: {
        type: Number,
        required: true
    },
    classNum: {
        type: Number,
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
    teacher:{type:String},
    minusNum:{type: Number}
}, { timestamps: true });

module.exports = mongoose.model('Minus', minusSchema);