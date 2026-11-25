# Speaking feature guide

Speaking owns the V2 session lifecycle client, REST and WebSocket operations, audio framing, assessment presentation, and learner routes. Its supported cross-feature API is `contract/index.ts`. Topic imports entry components and stable DTOs through `@features/speaking/contract`; hook, service implementation, types and utilities remain private unless explicitly exported.

## Find the implementation

- Public exports and consumer entry points: `contract/index.ts` and `views/SpeakingEntry.tsx`.
- REST paths and error mapping: `services/speaking-v2.service.ts`.
- WebSocket, microphone, VAD, reconnect and playback: `hooks/useSpeakingV2Stream.ts`.
- SPK2 audio frame format: `utils/speaking-audio-frame.ts`.
- Protocol DTOs: `types/speaking-v2.types.ts`.
- Standalone learner routes and views: `routes.ts`, `views/SpeakingSessionView.tsx`, `views/SpeakingResultView.tsx`, `views/SpeakingHistoryView.tsx`.
- Shared accepted wire contract: `docs/system-design/speaking-v2-contract.md` in the workspace root.

Topic owns profile authoring and Topic/Item workspace launch locations. Do not import Topic implementation from Speaking or add learning progress mutations to session flows. Keep UI states aligned to the accepted V2 contract and fixture.
