require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { connectDB } = require("./configs/db");
const { connectCloudinary } = require("./configs/cloudinary");
const { initSocket } = require("./configs/socket");
const { checkRedisAvailability } = require("./configs/redis");
const { initEmailQueue } = require("./queues/emailQueue");
const { initEmailWorker } = require("./workers/emailWorker");

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
    // Log error without crashing the server process on background promise failures
});

const startServer = async () => {
    try {
        await connectDB();
        connectCloudinary();

        // Check Redis availability once; activate BullMQ if available, else direct async
        const redisConfig = await checkRedisAvailability();
        if (redisConfig) {
            initEmailQueue(redisConfig);
            initEmailWorker(redisConfig);
            console.log("Redis connected successfully. BullMQ email queue active.");
        } else {
            console.log("Redis not detected (set REDIS_URL in .env to enable BullMQ). Using direct async email delivery.");
        }

        app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

        const allowedOrigins = [
            process.env.CLIENT_URL,
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
        ].filter(Boolean);

        app.use(
            cors({
                origin: function (origin, callback) {
                    if (!origin) return callback(null, true);
                    if (
                        allowedOrigins.includes(origin) ||
                        origin.endsWith(".vercel.app") ||
                        origin.endsWith(".onrender.com") ||
                        process.env.NODE_ENV !== "production"
                    ) {
                        return callback(null, origin);
                    }
                    return callback(new Error("CORS policy violation: Unauthorized origin blocked"), false);
                },
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
                message: "DevDash API is running",
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

        // Create HTTP server for Express and Socket.io integration
        server = http.createServer(app);

        // Initialize WebSockets with authentication & room handling
        initSocket(server, allowedOrigins);

        server.listen(PORT, () => {
            console.log(`Server and WebSocket running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

startServer();