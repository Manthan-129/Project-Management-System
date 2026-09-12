const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

const initSocket = (httpServer, allowedOrigins = []) => {
    io = new Server(httpServer, {
        cors: {
            origin: function (origin, callback) {
                if (!origin) return callback(null, true);
                if (
                    allowedOrigins.includes(origin) ||
                    origin.endsWith(".vercel.app") ||
                    origin.endsWith(".onrender.com") ||
                    process.env.NODE_ENV !== "production"
                ) {
                    return callback(null, true);
                }
                return callback(new Error("CORS policy violation: Unauthorized origin"), false);
            },
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            credentials: true,
        },
    });

    // JWT authentication middleware
    io.use((socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

            if (!token) return next(new Error("Authentication token required"));

            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            socket.userId = decoded.id;
            return next();
        } catch (err) {
            return next(new Error("Invalid authentication token"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.userId;
        socket.join(`user:${userId}`);

        socket.on("join:team", (teamId) => {
            if (teamId) socket.join(`team:${teamId.toString()}`);
        });

        socket.on("leave:team", (teamId) => {
            if (teamId) socket.leave(`team:${teamId.toString()}`);
        });
    });

    return io;
};

const emitToUser = (userId, event, data) => {
    if (io && userId) {
        io.to(`user:${userId.toString()}`).emit(event, data);
    }
};

const emitToTeam = (teamId, event, data) => {
    if (io && teamId) {
        io.to(`team:${teamId.toString()}`).emit(event, data);
    }
};

const emitToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

module.exports = {
    initSocket,
    emitToUser,
    emitToTeam,
    emitToAll,
};
