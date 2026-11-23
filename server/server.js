const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
require('dotenv').config();

const initializeFirebase = require('./config/db');

const app = express();

// Middleware
const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://<your-project>.firebaseapp.com',
    'https://<your-project>.web.app',
    'http://localhost:5173'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Origin not allowed by CORS'));
    }
}));
app.use(express.json());

// Initialize Firebase Admin / Firestore
initializeFirebase();

// Test route
app.get('/', (req, res) => {
    res.send('Welcome to EcoRoute API!');
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'EcoRoute backend is running!'
    });
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const journeyRoutes = require('./routes/journeyRoutes');
app.use('/api/journeys', journeyRoutes);

const routeRoutes = require('./routes/routeRoutes');
app.use('/api/routes', routeRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

const mapplsRoutes = require('./routes/mapplsRoutes');
app.use('/api/mappls', mapplsRoutes);

app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`EcoRoute server running on port ${PORT}`);
});