require('dotenv').config();
const express = require('express');
const cors= require('cors');
const morgan = require('morgan');

const {authRouter}= require('./routes/AuthRoutes')
const settingsRouter= require('./routes/SettingsRoutes');

const inviteRouter= require('./routes/DashboardRoutes/InviteRoutes.js');
const teamRouter= require('./routes/DashboardRoutes/TeamRoutes.js');
const taskRouter= require('./routes/DashboardRoutes/TaskRoutes.js');
const pullRequestRouter= require('./routes/DashboardRoutes/PullRequestRoutes.js');
const notificationRouter = require('./routes/DashboardRoutes/NotificationRoutes.js');

const {connectDB}= require('./configs/db');
const {connectCloudinary}= require('./configs/cloudinary');

const app= express();
const PORT= process.env.PORT || 5000;

// DataBases
connectCloudinary();
connectDB();
// middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(morgan('dev'));

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