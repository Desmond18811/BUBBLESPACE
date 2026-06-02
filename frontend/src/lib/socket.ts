import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta as any).env.VITE_API_URL
    ? (import.meta as any).env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:3000';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
    if (socket) return socket;

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['polling', 'websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from WebSocket server');
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
    });

    return socket;
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
