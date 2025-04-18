"use client";
import { VideoChat } from '@/components/VideoChat';
import { useState } from 'react';

export default function Home() {
  const [room, setRoom] = useState<string>('');
  const [joined, setJoined] = useState(false);

  const handleLeaveRoom = () => {
    setRoom('');
    setJoined(false);
  };
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setJoined(true);
  };

  return (<main className="p-4">
    {!joined ? (
      <section className="flex flex-col items-center">
        <h1 className="text-2xl mb-4">Join a Video Chat Room</h1>
        <p className="mb-2">Enter a room ID to join an existing room or create a new one.</p>
        <form onSubmit={handleJoinRoom}>
          <input
            value={room}
            required
            type="text"
            min={1}
            onChange={e => setRoom(e.target.value)}
            placeholder="Enter room ID"
            className="border p-2 rounded mr-2"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Join
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-500">Note: Room ID is case-sensitive.</p>
      </section>
    ) : (
      <section className='w-full h-full flex flex-col items-center'>
        <h1 className="text-2xl mb-4">Video Chat Room: {room}</h1>
        <VideoChat roomId={room} />
        <button onClick={handleLeaveRoom} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
          Leave Room
        </button>
      </section>
    )}
  </main>
  );
}
