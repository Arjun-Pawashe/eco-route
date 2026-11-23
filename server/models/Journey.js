const mongoose = require('mongoose');

const legSchema = new mongoose.Schema(
    {
        mode: { type: String, required: true },
        distance: { type: Number, required: true },
        duration: { type: Number, default: 0 },
        carbonEmission: { type: Number, default: 0 }
    },
    { _id: false }
);

const locationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        coordinates: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        }
    },
    { _id: false }
);

const journeySchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },
        origin: { type: locationSchema, required: true },
        destination: { type: locationSchema, required: true },
        transportMode: { type: String, required: true },
        distance: { type: Number, required: true },
        duration: { type: Number, default: 0 },
        carbonEmission: { type: Number, default: 0 },
        carbonSaved: { type: Number, default: 0 },
        preference: {
            type: String,
            enum: ['lowest-carbon', 'balanced', 'fastest'],
            default: 'balanced'
        },
        legs: {
            type: [legSchema],
            default: []
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Journey', journeySchema);
