require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { connectDB } = require("./config/db");
const { connectCloudinary } = require("./config/cloudinary");

const { authRouter } = require("./routes/AuthRoutes");
const settingsRouter = require("./routes/SettingsRoutes");
const inviteRouter = require("./routes/DashboardRoutes/InviteRoutes");
const teamRouter = require("./routes/DashboardRoutes/TeamRoutes");
const taskRouter = require("./routes/DashboardRoutes/TaskRoutes");
const pullRequestRouter = require("./routes/DashboardRoutes/PullRequestRoutes");
const notificationRouter = require("./routes/DashboardRoutes/NotificationRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

let server;

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

function shutdown(exitCode = 0) {
    if (server) {
        server.close(() => {
            console.log("Server closed.");
            process.exit(exitCode);
        });
    } else {
        process.exit(exitCode);
    }
}

process.on("SIGINT", () => {
    console.log("SIGINT received.");
    shutdown(0);
});

process.on("SIGTERM", () => {
    console.log("SIGTERM received.");
    shutdown(0);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    shutdown(1);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
    shutdown(1);
});

async function startServer() {
    try {
        await connectDB();
        connectCloudinary();

        app.use(helmet());

        app.use(
            cors({
                origin: process.env.CLIENT_URL || "http://localhost:5173",
                credentials: true,
            })
        );

        app.use(compression());

        app.use(express.json({ limit: "1mb" }));
        app.use(express.urlencoded({ extended: true, limit: "1mb" }));

        app.use(morgan("dev"));

        app.use("/api/auth", authLimiter);

        app.get("/", (req, res) => {
            res.status(200).json({
                success: true,
                message: "API is running 🚀",
            });
        });

        app.use("/api/auth", authRouter);
        app.use("/api/settings", settingsRouter);
        app.use("/api/invites", inviteRouter);
        app.use("/api/teams", teamRouter);
        app.use("/api/tasks", taskRouter);
        app.use("/api/pull-requests", pullRequestRouter);
        app.use("/api/notifications", notificationRouter);

        app.use((req, res) => {
            res.status(404).json({
                success: false,
                message: "Route not found",
            });
        });

        app.use((err, req, res, next) => {
            if (res.headersSent) {
                return next(err);
            }

            console.error(err.stack);

            res.status(err.status || 500).json({
                success: false,
                message: err.message || "Internal Server Error",
            });
        });

        server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

startServer();