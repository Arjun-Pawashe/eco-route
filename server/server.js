const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { createRateLimiter } = require('./middleware/rateLimitMiddleware');
require('dotenv').config();

const connectDB = require('./config/db');
const { initializeFirebaseAdmin } = require('./config/firebaseAdmin');

const mapsRoutes = require('./routes/mapsRoutes');
const userRoutes = require('./routes/userRoutes');
const journeyRoutes = require('./routes/journeyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://open-carbon-maps.firebaseapp.com',
    'https://open-carbon-maps.web.app',
    'http://localhost:5173'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origin not allowed by CORS'));
    }
}));
app.use(express.json());

const mapsLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: 'Too many map requests, please try again in a few minutes.'
});

app.get('/', (req, res) => {
    res.send('Welcome to EcoRoute API!');
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'EcoRoute backend is running!'
    });
});

app.use('/api/maps', mapsLimiter, mapsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
    initializeFirebaseAdmin();
    await connectDB();
    app.listen(PORT, () => {
        console.log(`EcoRoute server running on port ${PORT}`);
    });
}

if (require.main === module) {
    startServer().catch((err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
}

module.exports = app;