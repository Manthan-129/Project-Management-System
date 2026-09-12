import { io } from 'socket.io-client';
import { BASE_URL } from './apiPaths.js';

let socket = null;

const normalizeBaseUrl = (value) => {
    if (!value || typeof value !== 'string') {
        return 'http://localhost:5000';
    }
    return value.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '') || 'http://localhost:5000';
};

export const getSocket = () => socket;

export const connectSocket = (token) => {
    if (!token) return null;

    if (socket && socket.connected) {
        return socket;
    }

    if (socket) {
        socket.disconnect();
    }

    const backendUrl = normalizeBaseUrl(BASE_URL);

    socket = io(backendUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
        // Connected to DevDash Real-Time WebSocket Server
    });

    socket.on('connect_error', (error) => {
        console.warn('DevDash WebSocket connection notice:', error.message);
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
