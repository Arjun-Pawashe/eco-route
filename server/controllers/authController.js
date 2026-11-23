
const { findUserByEmail, createUser, getUser } = require('../services/firestore');
const bcrypt = require('bcryptjs');

// REGISTER USER
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        // Check whether user already exists
        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = await createUser({
            name,
            email,
            password: hashedPassword
        });

        // Send response without password
        res.status(201).json({
            success: true,
            message: 'User registered successfully!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                travelPreference: user.travelPreference
            }
        });

    } catch (error) {
        if (error.code === 'EMAIL_EXISTS') {
            return res.status(409).json({
                success: false,
                message: 'User already exists'
            });
        }
        console.error('Registration error:', error);

        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};


const jwt = require('jsonwebtoken');

// LOGIN USER
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                travelPreference: user.travelPreference
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const { password, ...publicUser } = user;
        res.status(200).json({ success: true, user: publicUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
};

module.exports = { registerUser, loginUser, getProfile };



