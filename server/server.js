require('dotenv').config();
const express = require('express');
const cors= require('cors');
const morgan = require('morgan');

const rateLimit = require('express-rate-limit');

const {authRouter}= require('./routes/AuthRoutes')
const settingsRouter= require('./routes/SettingsRoutes');

const inviteRouter= require('./routes/DashboardRoutes/InviteRoutes.js');
const teamRouter= require('./routes/DashboardRoutes/TeamRoutes.js');
const taskRouter= require('./routes/DashboardRoutes/TaskRoutes.js');
const pullRequestRouter= require('./routes/DashboardRoutes/PullRequestRoutes.js');
const notificationRouter = require('./routes/DashboardRoutes/NotificationRoutes.js');


// Rate limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Startup (await DB before listening)
const startServer = async () => {
    connectCloudinary();
    await connectDB();
    // Security & parsing middlewares
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
    app.use(morgan('dev'));
    // Apply rate limiting to auth routes
    app.use('/api/auth', authLimiter);
}

startServer();

// Routes
app.get('/', (req, res)=>{
    console.log("API is working fine");
    return res.status(200).json({message: "API is working fine!!"});
});

app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/invites', inviteRouter);
app.use('/api/teams', teamRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/pull-requests', pullRequestRouter);
app.use('/api/notifications', notificationRouter);

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})