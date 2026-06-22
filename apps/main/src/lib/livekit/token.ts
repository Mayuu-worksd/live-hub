import { AccessToken } from 'livekit-server-sdk';

export async function generateLiveKitToken(
  roomName: string,
  participantIdentity: string,
  canPublish: boolean
): Promise<string> {
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity: participantIdentity }
  );
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe: true,
  });
  return await at.toJwt();
}
