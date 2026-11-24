# Speaking V2 results and history

The result page is a standalone, read-only view of the server assessment and persisted messages. It contains exactly four criteria: pronunciation and fluency use a 100-point scale; grammar and vocabulary use a 5-point scale. A missing score is shown as unavailable and is never converted to zero.

Assessment status may remain `PENDING` or `FINALIZING` while the page polls. `READY` means all criteria were assessed, `PARTIAL` means one to three were assessed, and `UNAVAILABLE` means no criterion was assessed. Counts, reasons, accuracy/range details, examples and Vietnamese feedback come from the assessment response.

History is account-owned, scope-filterable, and contains no live socket or microphone controls. Session rows open the result route. The learner can replay authorized opening/turn audio, practice the same immutable scope again, return to the Topic/Item workspace, or soft-delete one or all of their records.

See [result contract](api-contract.md), [runtime flows](runtime-flows.md), and [shared protocol fixture](../../../../docs/system-design/speaking-v2-protocol.fixture.json) for the response shape and expected states.
