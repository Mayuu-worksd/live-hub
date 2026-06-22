export type AccentType = 'original' | 'american' | 'british' | 'australian';
export type QualityType = 'standard' | 'enhanced';
export type NoiseReductionLevel = 'off' | 'medium' | 'high';

export interface VoiceProfile {
  id: string;
  user_id: string;
  base_pitch_shift: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceSettings {
  id: string;
  user_id: string;
  accent: AccentType;
  quality: QualityType;
  noise_reduction: NoiseReductionLevel;
  is_enabled: boolean;
  updated_at: string;
}

export interface VoiceModel {
  id: string;
  name: string;
  type: 'accent' | 'enhancement' | 'clone';
  target_accent: AccentType | null;
  model_path: string;
  version: string;
  is_active: boolean;
  created_at: string;
}

export interface VoiceSession {
  id: string;
  user_id: string | null;
  livekit_room_name: string;
  model_id: string | null;
  started_at: string;
  ended_at: string | null;
  total_duration_seconds: number;
  model?: VoiceModel;
}

export interface VoiceUsageLog {
  id: string;
  session_id: string | null;
  user_id: string;
  duration_seconds: number;
  compute_cost_estimate: number;
  created_at: string;
}
