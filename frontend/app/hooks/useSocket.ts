'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(roomId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_BACKEND_URL!);
    setSocket(s);
    s.emit('join-room', roomId);

    return () => {
      s.disconnect();
    };
  }, [roomId]);

  return socket;
}
