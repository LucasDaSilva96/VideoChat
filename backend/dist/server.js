import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new IOServer(server, {
    cors: { origin: '*' },
});
// Simple “rooms” signaling
io.on('connection', (socket) => {
    console.log('✅', socket.id, 'connected');
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined', socket.id);
    });
    socket.on('signal', (payload) => {
        // relay SDP / ICE between peers
        io.to(payload.to).emit('signal', payload);
    });
    socket.on('disconnect', () => {
        console.log('❌', socket.id, 'disconnected');
        // optionally notify peers…
    });
});
const PORT = process.env.PORT || 4000;
console.log(process.env.PORT, 'PORT');
server.listen(PORT, () => {
    console.log(`🚀 Signaling server listening on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map