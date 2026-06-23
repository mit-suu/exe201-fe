import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

let socket = null;
let refCount = 0;

export const connectSocket = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  }
  refCount++;
  return socket;
};

export const getSocket = () => {
  if (!socket || !socket.connected) {
    return connectSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  refCount = Math.max(0, refCount - 1);
  // Chỉ disconnect khi refCount về 0 (không component nào còn dùng)
  if (refCount === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
};
