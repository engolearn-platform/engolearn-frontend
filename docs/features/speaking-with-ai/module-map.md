# Speaking module map

The Speaking feature owns the session capability, REST client, realtime stream, protocol types, and demo API client. Topic owns the learning UI, its routes and navigation, the result entry point, and the presentation of achievements and session results. Topic reaches the capability through [the Speaking public contract](../../../src/features/speaking/contract/index.ts).

## Locate code by task

| Task | Start here | Ownership and next step |
| --- | --- | --- |
| Change session creation, resume, completion, history, playback, deletion, or HTTP errors | [speaking.service.ts](../../../src/features/speaking/services/speaking.service.ts) | Speaking implementation; review its public exports in the contract and FE–BE details in [API contract](api-contract.md). |
| Change realtime connection, microphone capture, PCM frames, turn lifecycle, reconnection, or snapshot events | [useSpeakingStream.ts](../../../src/features/speaking/hooks/useSpeakingStream.ts) | Speaking implementation; consumers use the contract. The PCM processor is [speaking-pcm-worklet.js](../../../public/speaking-pcm-worklet.js), loaded at `/speaking-pcm-worklet.js`. |
| Change validated dialogue decision parsing | [speakingDialogueDecision.ts](../../../src/features/speaking/hooks/speakingDialogueDecision.ts) | Speaking implementation detail used by the stream hook. |
| Change protocol or session snapshot types | [speaking.types.ts](../../../src/features/speaking/types/speaking.types.ts) | Speaking owns these types; publish a type from the contract only when consumers need it. |
| Change legacy demo REST/multipart capabilities | [speaking-demo.service.ts](../../../src/features/speaking/services/speaking-demo.service.ts) and [speaking-demo.types.ts](../../../src/features/speaking/types/speaking-demo.types.ts) | Speaking owns the API capability. Topic's dev-only demo view owns MediaRecorder and its UI. |
| Change session/history/turn learning UI or its navigation | [SpeakingView.tsx](../../../src/features/topic/views/learning/SpeakingView.tsx) | Topic implementation consuming Speaking via the contract; Topic retains all related route declarations. |
| Change the item-result launch entry point | [TopicItemResultView.tsx](../../../src/features/topic/views/learning/TopicItemResultView.tsx) | Topic implementation. It reads the feature flag from the Speaking contract and builds the Topic route. |
| Change the legacy demo interaction | [SpeakingDemoView.tsx](../../../src/features/topic/views/learning/SpeakingDemoView.tsx) | Topic presentation and view-local MediaRecorder, using the Speaking contract for its API and types. |
| Change achievement selection or session-summary presentation | [speakingAchievementLogic.ts](../../../src/features/topic/views/learning/speaking-achievements/speakingAchievementLogic.ts) and [speakingAchievementAdapter.ts](../../../src/features/topic/views/learning/speaking-achievements/speakingAchievementAdapter.ts) | Topic presentation logic. Its focused test is [speakingAchievementLogic.test.ts](../../../src/features/topic/views/learning/speaking-achievements/speakingAchievementLogic.test.ts). |
| Change route ownership or DEV-only route registration | [topic/routes.ts](../../../src/features/topic/routes.ts) | Topic owns item, history and demo routes. The app router aggregates Topic routes in [router.tsx](../../../src/router.tsx). |

## Public boundary

`@features/speaking/contract` is the supported cross-feature entry point. It publishes the session service, availability flag, realtime hook and snapshot event, session types needed by Topic, and the verified demo client and types. Provider files under `hooks/`, `services/`, and `types/` stay internal unless explicitly re-exported by the contract. The contract does not depend on Topic.

Topic may compose its own navigation and achievement presentation around the provider. Do not move Topic UI or its achievement adapter into Speaking. Generic HTTP transport remains in `shared/`; Speaking protocol and session behavior remain owned by Speaking.

## Related references

- [Runtime flows](runtime-flows.md) traces UI-to-contract-to-provider-to-backend behavior.
- [User flows](user-flows.md) describes learner entry points and supported interactions.
- [Achievement and session result](achievement-session-result.md) documents Topic-owned presentation.
- [FE–BE API contract](api-contract.md) records REST and WebSocket message shapes.
- [Business module](../../../../docs/engolearn-business-doc/docs/usecase_spec/speaking-with-AI/00-module.md) is the behavioral authority.
- [Backend Speaking overview](../../../../engolearn-backend/docs/features/speaking-with-ai/README.md) maps the backend implementation and known gaps.
