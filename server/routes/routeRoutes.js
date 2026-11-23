const express = require('express');
const router = express.Router();

const { planRoute } = require('../controllers/routeController');
const protect = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validationMiddleware');

const { planRouteValidator } = require('../validators/routeValidator');

router.post(
    '/plan',
    protect,
    planRouteValidator,
    validateRequest,
    planRoute
);

module.exports = router;