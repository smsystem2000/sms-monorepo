const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB, ensureDbConnection } = require('./configs/db');
const announcementRoutes = require('./routes/announcement.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// CORS Configuration
const allowedUrls = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
    : ['http://localhost:3000', 'http://localhost:5173', "https://sms-web-ui.vercel.app"];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedUrls.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB auto-reconnection middleware
app.use(ensureDbConnection);

// Routes
app.use('/api/notifications/school/:schoolId/announcements', announcementRoutes);
app.use('/api/notifications/school/:schoolId/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Notification Service is running' });
});

app.get("/", (_req, res) => {
    res.send(`🔔 Notification Service is running`);
});

// Start server
const PORT = process.env.PORT || 5004;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🔔 Notification Service is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to database:', error.message);
        process.exit(1);
    });

module.exports = app;
