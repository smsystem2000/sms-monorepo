const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./configs/db');
const teacherRoutes = require('./routes/teacher.routes');
const studentRoutes = require('./routes/student.routes');
const parentRoutes = require('./routes/parent.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const requestRoutes = require('./routes/request.routes');
const classRoutes = require('./routes/class.routes');
const subjectRoutes = require('./routes/subject.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const leaveRoutes = require('./routes/leave.routes');

const app = express();

// CORS Configuration
const allowedUrls = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
    : ['http://localhost:3000', 'http://localhost:5173', "https://sms-web-ui.vercel.app"];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
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

// School-specific user routes (stored in school databases)
app.use('/api/school/:schoolId/teachers', teacherRoutes);
app.use('/api/school/:schoolId/students', studentRoutes);
app.use('/api/school/:schoolId/parents', parentRoutes);
app.use('/api/school/:schoolId/dashboard', dashboardRoutes);
app.use('/api/school/:schoolId/requests', requestRoutes);
app.use('/api/school/:schoolId/classes', classRoutes);
app.use('/api/school/:schoolId/subjects', subjectRoutes);
app.use('/api/school/:schoolId/attendance', attendanceRoutes);
app.use('/api/school/:schoolId/leave', leaveRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});
app.get("/", (_req, res) => {
    res.send(`🚀 Server is running Securely`);
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to database:', error.message);
        process.exit(1);
    });

module.exports = app;
