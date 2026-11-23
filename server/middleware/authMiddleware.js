const { admin } = require('../config/firebaseAdmin');

const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authorization token missing'
        });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authorization token missing'
        });
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = {
            uid: decoded.uid,
            email: decoded.email || '',
            name: decoded.name || ''
        };
        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired Firebase token'
        });
    }
};

module.exports = { requireAuth };
