import mongoose from 'mongoose';

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
    minusNum:{type: Number},
    academicYear: {
        type: String,
    }
}, { timestamps: true });

export default mongoose.models['Minus'] || mongoose.model('Minus', minusSchema);
