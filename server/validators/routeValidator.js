const { body } = require('express-validator');

const planRouteValidator = [
    body('origin')
        .trim()
        .notEmpty()
        .withMessage('Origin is required'),

    body('destination')
        .trim()
        .notEmpty()
        .withMessage('Destination is required'),

    body('preference')
        .optional()
        .isIn(['lowest-carbon', 'balanced', 'fastest'])
        .withMessage('Invalid travel preference')
];

module.exports = { planRouteValidator };