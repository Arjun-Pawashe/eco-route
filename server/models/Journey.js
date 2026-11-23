
const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        origin: {
            name: {
                type: String,
                required: true,
                trim: true
            },
            coordinates: {
                lat: Number,
                lng: Number
            }
        },

        destination: {
            name: {
                type: String,
                required: true,
                trim: true
            },
            coordinates: {
                lat: Number,
                lng: Number
            }
        },

        transportMode: {
            type: String,
            enum: [
                'bus',
                'train',
                'metro',
                'car',
                'bike',
                'walking',
                'multimodal'
            ],
            required: true
        },

        distance: {
            type: Number,
            required: true,
            min: 0
        },

        duration: {
            type: Number,
            required: true,
            min: 0
        },

        carbonEmission: {
            type: Number,
            required: true,
            min: 0
        },

        carbonSaved: {
            type: Number,
            default: 0,
            min: 0
        },

        preference: {
            type: String,
            enum: ['lowest-carbon', 'balanced', 'fastest'],
            default: 'balanced'
        },

        legs: [
            {
                mode: String,
                distance: Number,
                duration: Number,
                carbonEmission: Number
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Journey', journeySchema);
