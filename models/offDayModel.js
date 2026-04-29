import mongoose from 'mongoose';

const offDaySchema = new mongoose.Schema({
    fromDateTime: {
        type: Date,
        required: true
    },
    toDateTime: {
        type: Date
    },
    type: {
        type: String,
        enum: ['global', 'class_specific'],
        default: 'global'
    },
    classes: {
        type: [String], // Array of class numbers e.g. ["1", "2"]
        default: []
    },
    description: {
        type: String
    }
}, { timestamps: true });

if (mongoose.models['OffDay']) {
    delete mongoose.models['OffDay'];
}

export default mongoose.model('OffDay', offDaySchema);
