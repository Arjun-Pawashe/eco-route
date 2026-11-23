const { body } = require('express-validator');

const preferenceValidator = [
    body('travelPreference')
        .notEmpty()
        .withMessage('Travel preference is required')
        .isIn(['lowest-carbon', 'balanced', 'fastest'])
        .withMessage('Invalid travel preference')
];

module.exports = { preferenceValidator };