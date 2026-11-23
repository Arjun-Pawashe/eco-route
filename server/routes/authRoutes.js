
const express = require('express');
const router = express.Router();



const {
    registerUser,
    loginUser
} = require('../controllers/authController');

const validateRequest = require('../middleware/validationMiddleware');

const {
    registerValidator,
    loginValidator
} = require('../validators/authValidator');

router.post('/register', registerValidator, validateRequest, registerUser);

router.post('/login', loginValidator, validateRequest, loginUser);

module.exports = router;



const protect = require('../middleware/authMiddleware');
const User = require('../models/User');

router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

