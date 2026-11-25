# Speaking V2 browser evidence

Run `node tools/speaking/check-redesign.mjs` from the frontend checkout with
dependencies installed and desktop Chrome available. The checker starts the
regular Vite application on port 3013 and launches Chrome headlessly in a
temporary profile. Its local HTTP and WebSocket fixtures cover auth, saved
turns, assessment, and turn admission with a browser-provided fake microphone.
No configured backend or speech provider is needed.

Screenshots are written to `../screen-shot/speaking-v2`. Set
`SPEAKING_EVIDENCE_DIR` to write to another directory or
`SPEAKING_CHROME_EXECUTABLE` to select a Chrome binary. The optional `before`
argument renders the original views from Git `HEAD`. Set
`SPEAKING_BASELINE_REVISION` to select a different baseline revision.
