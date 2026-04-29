import mongoose from 'mongoose';

const offDaySchema = new mongoose.Schema({
    fromDate: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    toDate: {
        type: String, // Format: YYYY-MM-DD (optional)
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
