# Speaking V2 runtime flows

## Entry from Topic

Topic detail exposes one topic-level Speaking entry and a separate entry on each item card. Topic routes mount `TopicSpeakingEntry` or `ItemSpeakingEntry` from Speaking's public contract. Entry reads availability for the exact scope. The learner explicitly starts or resumes a session; before create or replacement, the browser checks microphone permission and immediately releases the probe tracks. Topic Learning progress is not mutated.

## Session and microphone

The standalone workspace loads the authoritative session and saved turn page, obtains a one-time socket ticket, connects to the server `wsPath` while the session initializes, and sends `SYNC_SESSION`. The socket stays open through active work and closing so opening and terminal events are delivered on that connection. Once connected, the learner can start a turn. The hook sends `START_TURN` and waits for `TURN_ACCEPTED` before requesting microphone capture. AudioWorklet output is framed as mono 16 kHz signed PCM16 little-endian chunks. VAD stops after 2.6 seconds of silence following detected speech; the learner can also stop or discard manually.

Finishing sends `END_TURN`; capture is already stopped and the interface waits for the server processing acknowledgement. Discard sends `CANCEL_TURN` and waits for `TURN_SKIPPED`. Ending during capture presents an explicit finalize-or-discard choice. A tab close or disconnect never ends the session.

## Messages, reconnect and audio

Partial/final transcript updates belong to the active turn. Persisted `TURN_RESULT` fields are rendered with that same turn: correction under the learner message and hint under the corresponding AI reply. The client does not make an extra model request. On disconnect it stops the mic, retries tickets with bounded backoff, syncs the session and reloads saved turns. `SESSION_STATE.activeTurn` reconciles any raced receiving or sealed work: a remaining receiving recording can be discarded explicitly; sealed work stays pending until its terminal event. Turn IDs deduplicate updates and stale socket handlers are ignored. A retryable generation failure can be retried only when its transcript is persisted; `RETRY_TURN` keeps the original server turn ID and waits for its correlated acknowledgement.

Opening and assistant text remain usable when synthesis fails. Opening and reply WAV streams are played after all framed chunks arrive and the server's declared byte length matches. An incomplete stream or playback error leaves text visible and gives a recovery message. Stable speech-recognition, empty-audio, generation, quota and connection errors map to Vietnamese recovery guidance; an unavailable transcript is kept distinct from an empty numeric or result value.

## Result and history

The result route polls assessment while status is `PENDING` or `FINALIZING`, with bounded backoff and unmount cleanup. It shows only pronunciation, fluency, grammar and vocabulary, preserving the acoustic 100-point and language 5-point scales. Null scores remain “Chưa có điểm”; partial and unavailable states explain what could not be assessed. History and result routes use REST only, are scoped to the authenticated account, and can replay authorized audio while available. Practice again and return links derive from the immutable session scope.
