
const express = require('express');
const router = express.Router();



const {
    registerUser,
    loginUser,
    getProfile
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const validateRequest = require('../middleware/validationMiddleware');

const {
    registerValidator,
    loginValidator
} = require('../validators/authValidator');

router.post('/register', registerValidator, validateRequest, registerUser);

router.post('/login', loginValidator, validateRequest, loginUser);
router.get('/profile', protect, getProfile);

module.exports = router;

