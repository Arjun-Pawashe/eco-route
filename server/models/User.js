
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        travelPreference: {
            type: String,
            enum: ['lowest-carbon', 'balanced', 'fastest'],
            default: 'balanced'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);
