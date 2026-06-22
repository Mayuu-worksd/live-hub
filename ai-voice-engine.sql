-- AI Voice Engine Schema Migration

-- ENUMS
CREATE TYPE accent_type AS ENUM ('original', 'american', 'british', 'australian');
CREATE TYPE quality_type AS ENUM ('standard', 'enhanced');
CREATE TYPE noise_reduction_level AS ENUM ('off', 'medium', 'high');

-- VOICE PROFILES
CREATE TABLE voice_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    base_pitch_shift FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VOICE SETTINGS
CREATE TABLE voice_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    accent accent_type DEFAULT 'original',
    quality quality_type DEFAULT 'standard',
    noise_reduction noise_reduction_level DEFAULT 'off',
    is_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VOICE MODELS (Pre-approved models)
CREATE TABLE voice_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'accent', 'enhancement', 'clone'
    target_accent accent_type,
    model_path VARCHAR(500) NOT NULL,
    version VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VOICE SESSIONS (Active/Past processing sessions)
CREATE TABLE voice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    livekit_room_name VARCHAR(255) NOT NULL,
    model_id UUID REFERENCES voice_models(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    total_duration_seconds INTEGER DEFAULT 0
);

-- VOICE USAGE LOGS (For billing/analytics)
CREATE TABLE voice_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES voice_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    duration_seconds INTEGER NOT NULL,
    compute_cost_estimate DECIMAL(10,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Voice Models
INSERT INTO voice_models (name, type, target_accent, model_path, version) VALUES
('StreamVC Noise Suppressor', 'enhancement', NULL, 's3://models/enhancement/streamvc-noise-v1', '1.0'),
('RVC Generic American', 'accent', 'american', 's3://models/accent/rvc-american-v1', '1.0'),
('RVC Generic British', 'accent', 'british', 's3://models/accent/rvc-british-v1', '1.0'),
('RVC Generic Australian', 'accent', 'australian', 's3://models/accent/rvc-australian-v1', '1.0');
