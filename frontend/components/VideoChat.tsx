import { useSocket } from '@/app/hooks/useSocket';
import { useWebRTC } from '@/app/hooks/useWebRTC';
import React from 'react';

interface VideoChatProps {
  roomId: string;
}

export function VideoChat({ roomId }: VideoChatProps) {
  const socket = useSocket(roomId);
  const { localRef } = useWebRTC(roomId, socket);

  return (
    <div id='video_container' className="flex flex-wrap items-center p-4 gap-2">


      <div className="w-full max-w-md h-full flex items-center bg-neutral-900 rounded-lg shadow-lg p-2">
        <video ref={localRef} autoPlay playsInline className="rounded-lg shadow-lg" />
      </div>
    </div>
  );
}
