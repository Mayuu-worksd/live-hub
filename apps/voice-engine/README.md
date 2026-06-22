# AI Voice Engine Backend (Pending Implementation)

The Python backend required for Seed-VC voice conversion has been frozen and its mock code removed to prevent confusion.

This directory is structurally reserved for the GPU microservice.

## Future Deployment Requirements
To implement the backend when hardware becomes available:
1.  **Hardware:** Requires Nvidia GPU instances (e.g., L4, A10G, or RTX 3090+). CPU inference will not support real-time audio.
2.  **Model:** Clone [Seed-VC](https://github.com/Plachtaa/seed-vc) into this directory. Download the `.pt` models and vocoder.
3.  **WebSocket Server:** Build a FastAPI or similar WebSocket server to accept `Float32` PCM audio chunks from the frontend.
4.  **Frontend:** Uncomment the `WebSocket` initialization code in `apps/main/src/hooks/useVoiceEngine.ts` and write an `AudioWorkletNode` to slice the microphone feed into PCM arrays for transmission.

Until then, the frontend architecture (`useVoiceEngine.ts`) operates safely in "pass-through" mode, broadcasting raw audio untouched.
