const { body, param } = require('express-validator');

const saveJourneyValidator = [
    body('origin.name').trim().notEmpty().withMessage('Origin name is required'),
    body('destination.name').trim().notEmpty().withMessage('Destination name is required'),
    body('transportMode').isIn([
        'bus', 'train', 'metro', 'car', 'bike', 'walking',
        'two-wheeler', 'auto-rickshaw', 'ev-car', 'ev-scooter', 'multimodal'
    ]),
    body('distance').isFloat({ min: 0 }),
    body('duration').isFloat({ min: 0 }),
    body('carbonEmission').isFloat({ min: 0 })
];

const journeyIdValidator = [
    param('id')
        .isLength({ min: 1, max: 128 })
        .matches(/^[A-Za-z0-9_-]+$/)
        .withMessage('Invalid journey ID')
];

module.exports = { saveJourneyValidator, journeyIdValidator };