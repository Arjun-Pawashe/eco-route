const mongoose = require('mongoose');

const savedPlaceSchema = new mongoose.Schema(
    {
        label: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        lat: { type: Number, required: true },
        lon: { type: Number, required: true }
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        name: {
            type: String,
            trim: true,
            default: 'EcoRoute User'
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ''
        },
        travelPreference: {
            type: String,
            enum: ['lowest-carbon', 'balanced', 'fastest'],
            default: 'balanced'
        },
        savedPlaces: {
            type: [savedPlaceSchema],
            default: []
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
