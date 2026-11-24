# Speaking entry points

Topic detail offers a topic-level Speaking entry and each item card offers an Item-level entry. The route mounts `TopicSpeakingEntry` or `ItemSpeakingEntry` from `@features/speaking/contract`; Topic does not call Speaking internals. Speaking checks exact-scope availability and owns the standalone workspace, result and history routes.

These routes require authentication. Speaking creation is explicit and requests microphone permission before session creation. Topic Learning attempts, quiz answers, completion and progress are not changed by Speaking.

Topic managers configure optional topic/item Speaking profiles at `/admin/topics/{topicId}/speaking-profile` and `/admin/topics/{topicId}/items/{itemId}/speaking-profile`. The editor uses Topic's profile API, revision conflict reload, Content Manager route/control guards, enabled-only validation, and resource IDs returned by the server.

See [Speaking V2 user flows](../../speaking-with-ai/user-flows.md), [module map](../../speaking-with-ai/module-map.md), and the accepted [shared contract](../../../../../docs/system-design/speaking-v2-contract.md).
