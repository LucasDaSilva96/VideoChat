'use client';
import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

export function useWebRTC(roomId: string, socket: Socket | null) {
  const localRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [id: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  function createVideoElement(event: RTCTrackEvent, peerId: string) {
    const container = document.getElementById('video_container')!;
    const existingDiv = document.getElementById(peerId);
    if (existingDiv) {
      existingDiv.remove(); // Remove existing video element if it exists
    }
    const div = document.createElement('div');
    div.className =
      'w-full max-w-md h-full flex items-center bg-neutral-900 rounded-lg shadow-lg p-2';
    div.id = peerId;
    const localVid = document.createElement('video');
    localVid.srcObject = event.streams[0];
    localVid.autoplay = true;
    localVid.playsInline = true;
    localVid.className = 'rounded-lg shadow-lg';
    div.appendChild(localVid);
    container.appendChild(div);
  }

  function removeVideoElement(peerId: string) {
    const remoteVid = document.getElementById(peerId);
    if (remoteVid) {
      remoteVid.remove();
    }
  }

  // Helper to create and handle a peer connection
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createPeerConnection = (peerId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peersRef.current[peerId] = pc;

    // Send ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('signal', {
          to: peerId,
          from: socket.id,
          data: { candidate: event.candidate },
        });
      }
    };

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Show incoming stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        createVideoElement(event, peerId);
      } else {
        console.warn('No streams found in ontrack event:', event);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected') {
        // Handle disconnection (optional)
        pc.close();
        delete peersRef.current[peerId];
        removeVideoElement(peerId);
      }
    };

    return pc;
  };

  useEffect(() => {
    if (!socket) return;

    // Set up socket event handlers BEFORE getUserMedia
    socket.on('all-users', async (existingUserIds: string[]) => {
      for (const peerId of existingUserIds) {
        const pc = createPeerConnection(peerId, true);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('signal', {
          to: peerId,
          from: socket.id,
          data: { sdp: pc.localDescription },
        });
      }
    });

    socket.on('user-joined', async (peerId: string) => {
      if (!peersRef.current[peerId]) {
        createPeerConnection(peerId, false);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('signal', async (payload: { from: string; data: any }) => {
      const { from, data } = payload;
      let pc = peersRef.current[from];

      if (!pc) {
        pc = createPeerConnection(from, false);
      }

      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', {
            to: from,
            from: socket.id,
            data: { sdp: pc.localDescription },
          });
        }
      } else if (data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.warn('Failed to add ICE candidate:', err);
        }
      }
    });

    // Get user media AFTER setting up handlers
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localRef.current) {
          localRef.current.srcObject = stream;
        }

        // Join the room only after setting up everything
        socket.emit('join-room', roomId);
      });

    return () => {
      // Cleanup (optional)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(peersRef.current).forEach((pc) => pc.close());
      socket.off('all-users');
      socket.off('user-joined');
      socket.off('signal');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomId]);

  return { localRef };
}
