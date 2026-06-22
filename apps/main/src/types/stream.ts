export type StreamStatus = 'offline' | 'live' | 'ended';
export type StreamCategory = 'gaming' | 'music' | 'talk' | 'dance' | 'sports' | 'education' | 'travel' | 'food';

export interface Stream {
  id: string;
  host_id: string;
  livekit_room_name: string;
  title: string;
  thumbnail_url: string | null;
  category: StreamCategory;
  status: StreamStatus;
  viewer_count: number;
  peak_viewers: number;
  total_gifts_received: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  host?: {
    id: string;
    username: string;
    profile: {
      display_name: string | null;
      avatar_url: string | null;
    };
  };
}

export interface StreamMessage {
  id: string;
  stream_id: string;
  user_id: string;
  content: string;
  type: 'text' | 'gift' | 'system' | 'pin';
  metadata?: Record<string, unknown>;
  created_at: string;
  user?: {
    id: string;
    username: string;
    profile: {
      display_name: string | null;
      avatar_url: string | null;
    };
  };
}
