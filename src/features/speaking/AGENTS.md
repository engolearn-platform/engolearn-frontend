# Speaking feature guide

Speaking owns speaking sessions, REST and realtime operations, audio-stream integration, and Speaking protocol types. Its supported cross-feature API is `contract/index.ts`. Consumer features import from `@features/speaking/contract`; files under Speaking `hooks/`, `services/`, and `types/` remain implementation details unless the contract publishes them.

## Find the implementation

- Public exports and their consumer needs: `contract/index.ts`.
- Session and demo API behavior: `services/`.
- WebSocket, microphone, PCM, and snapshot behavior: `hooks/useSpeakingStream.ts`.
- REST and demo response shapes: `types/`.
- Topic consumers, learning routes, UI, and achievement presentation: `src/features/topic/`. The presentation selector test is [speakingAchievementLogic.test.ts](../../../src/features/topic/views/learning/speaking-achievements/speakingAchievementLogic.test.ts).
- Speaking documentation: `docs/features/speaking-with-ai/README.md`, especially [module-map.md](../../../docs/features/speaking-with-ai/module-map.md) and [runtime-flows.md](../../../docs/features/speaking-with-ai/runtime-flows.md).

The current Speaking learning UI and its routes belong to Topic. Speaking does not provide a standalone view or routes.

## Keeping the boundary current

When a consumer needs a provider capability, export its stable type or operation from the public contract. Keep parsing and implementation helpers internal unless another feature has a verified need. Do not import Topic implementation from Speaking or expose Topic presentation components through this contract. Update the API documentation when the FE–BE contract changes and update the module map/runtime flows when ownership or behavior paths change.
