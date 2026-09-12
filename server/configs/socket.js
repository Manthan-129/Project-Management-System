const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Team = require("../models/Team");

const SOCKET_EVENTS = Object.freeze({
    TEAM_SUBSCRIBE: "team:subscribe",
    TEAM_UNSUBSCRIBE: "team:unsubscribe",
    TEAM_SUBSCRIPTION_ERROR: "team:subscription_error",
    LEGACY_JOIN_TEAM: "join:team",
    LEGACY_LEAVE_TEAM: "leave:team",
    TASK_CREATED: "task:created",
    TASK_ASSIGNED: "task:assigned",
    TASK_UNASSIGNED: "task:unassigned",
    TASK_STATUS_UPDATED: "task:status_updated",
    TASK_UPDATED: "task:updated",
    TASK_DELETED: "task:deleted",
    TASK_RESTORED: "task:restored",
    TEAM_INVITATION_RECEIVED: "team:invitation_received",
    TEAM_INVITATION_RESPONDED: "team:invitation_responded",
    FRIEND_REQUEST_RECEIVED: "friend:request_received",
    NOTIFICATION_RECEIVED: "notification:received",
    NOTIFICATION_MARKED_READ: "notification:marked_read",
    NOTIFICATION_ALL_MARKED_READ: "notification:all_marked_read",
});

let io = null;

const normalizeId = (value) => {
    if (!value) return "";
    return value.toString().trim();
};

const userRoom = (userId) => `user:${normalizeId(userId)}`;
const teamRoom = (teamId) => `team:${normalizeId(teamId)}`;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const canJoinTeamRoom = async (userId, teamId) => {
    if (!isValidObjectId(teamId) || !isValidObjectId(userId)) {
        return false;
    }

    const team = await Team.exists({
        _id: teamId,
        $or: [{ leader: userId }, { "members.user": userId }],
    });

    return Boolean(team);
};

const handleTeamRoomSubscription = async (socket, teamId, shouldJoin) => {
    const normalizedTeamId = normalizeId(teamId);
    if (!normalizedTeamId) {
        return { success: false, message: "teamId is required" };
    }

    const allowed = await canJoinTeamRoom(socket.userId, normalizedTeamId);
    if (!allowed) {
        socket.emit(SOCKET_EVENTS.TEAM_SUBSCRIPTION_ERROR, {
            teamId: normalizedTeamId,
            message: "Access denied for team subscription",
        });
        return { success: false, message: "Access denied for team subscription" };
    }

    if (shouldJoin) {
        socket.join(teamRoom(normalizedTeamId));
    } else {
        socket.leave(teamRoom(normalizedTeamId));
    }

    return { success: true, teamId: normalizedTeamId };
};

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

    io.use((socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

            if (!token) return next(new Error("Authentication token required"));

            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            socket.userId = decoded.id;
            return next();
        } catch (_error) {
            return next(new Error("Invalid authentication token"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(userRoom(socket.userId));

        const subscribeToTeam = async (teamId, ack) => {
            const result = await handleTeamRoomSubscription(socket, teamId, true);
            if (typeof ack === "function") ack(result);
        };

        const unsubscribeFromTeam = async (teamId, ack) => {
            const result = await handleTeamRoomSubscription(socket, teamId, false);
            if (typeof ack === "function") ack(result);
        };

        socket.on(SOCKET_EVENTS.TEAM_SUBSCRIBE, subscribeToTeam);
        socket.on(SOCKET_EVENTS.TEAM_UNSUBSCRIBE, unsubscribeFromTeam);
        socket.on(SOCKET_EVENTS.LEGACY_JOIN_TEAM, subscribeToTeam);
        socket.on(SOCKET_EVENTS.LEGACY_LEAVE_TEAM, unsubscribeFromTeam);
    });

    return io;
};

const emitToUser = (userId, event, data = {}) => {
    const normalizedUserId = normalizeId(userId);
    if (!io || !normalizedUserId || !event) return;
    io.to(userRoom(normalizedUserId)).emit(event, data);
};

const emitToUsers = (userIds = [], event, data = {}) => {
    if (!Array.isArray(userIds) || !event) return;

    userIds
        .map((userId) => normalizeId(userId))
        .filter(Boolean)
        .forEach((userId) => {
            emitToUser(userId, event, data);
        });
};

const emitToTeam = (teamId, event, data = {}) => {
    const normalizedTeamId = normalizeId(teamId);
    if (!io || !normalizedTeamId || !event) return;
    io.to(teamRoom(normalizedTeamId)).emit(event, data);
};

const emitToAll = (event, data = {}) => {
    if (!io || !event) return;
    io.emit(event, data);
};

module.exports = {
    SOCKET_EVENTS,
    initSocket,
    emitToUser,
    emitToUsers,
    emitToTeam,
    emitToAll,
};
