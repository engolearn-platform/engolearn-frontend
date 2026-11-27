# Topic Management Read-only Flow (F05–F08)

## Routes and source data

All routes require a Content Manager or Admin role. They use the existing management layout and GET services. Direct navigation and refresh load the route IDs from the API.

| Feature | Route | API source | State |
|---|---|---|---|
| F05 Topic list | `/admin/topics/read` | `GET /api/management/topics` | API-backed filters, three-status counters, page results and empty/error state |
| F05 Topic detail | `/admin/topics/:topicId/view` | `GET /api/management/topics/{topicId}` | API-backed metadata and version fields |
| F06 Topic Items | `/admin/topics/:topicId/view/items` | `GET /api/management/topics/{topicId}/items` | API order, status, duration and version summary |
| F07 Context | `/admin/topics/:topicId/view/items/:itemId/context` | `GET /api/management/topics/{topicId}/items/{itemId}` | Persisted context and dialogue |
| F07 Vocabulary | same route with `/vocabulary` | same Item detail GET | Persisted vocabulary, examples, collocations, media and quick checks |
| F07 Expressions | same route with `/expressions` | same Item detail GET | Persisted groups, examples, media and linked vocabulary IDs |
| F07 Quiz | same route with `/quiz` | same Item detail GET | Persisted questions, options, correct answers and explanations for management |
| F08 Saved draft | Topic and Item detail routes above | management Topic and Item GETs | Displays the version/status returned by the API; the frontend does not select a version |

The Item detail contract is returned as a single flattened record with nullable `context` and resource arrays. The screen renders API arrays in response order. Empty arrays and null resources remain empty states. Item status and version metadata are displayed directly from the response.

## P04 Topic publication status

The manager list shows Draft, Published and Unpublished, filters by the corresponding server status, and renders the three counters. The Topic Items workspace can unpublish a released Topic with the current revision, then reloads the Topic and Items. Its confirmation explains that release history, progress and pinned learning attempts remain stored; it makes no claim about downstream Learner visibility.

An Unpublished Topic keeps its release pointer and remains editable through the existing MAJOR and MINOR flows. The existing readiness check and publish command serve both changed and unchanged republish. A successful response with the same release ID is reported as reuse; a new release ID is reported as a new version. A failed or ambiguous request triggers a status reload and is never shown as a confirmed success.

## Coverage matrix

| Area | Before | After |
|---|---|---|
| F05 list | List GET existed in FE. Edit, create and unpublish controls shared the same view. | Read-only route reuses list, filters and table. It hides mutation controls and navigates to read-only detail. |
| F05 detail | GET existed for edit. Non-404 failures and empty data could fall back to a mock snapshot. | Dedicated read-only page displays Topic API data and explicit error state without snapshot fallback. |
| F06 Item list | Detail mapper returned an empty list. | Topic-scoped Item GET is used, preserving the API order and IDs. |
| F07 resources | Context, Vocabulary, Expressions and Quiz editors loaded hard-coded drafts. | Read-only tabs render the persisted resource detail, including quiz answers and media URLs. |
| F08 saved draft/version | No management Item read route or version view. | Topic/Item version metadata from the management API is displayed without local version inference. |
| RBAC | Management routes required authentication only. | Management route boundary requires Content Manager or Admin. Backend authorization remains authoritative. |

## Fixture inventory

| Component or field | Source and reason | Replacement path |
|---|---|---|
| Resource tab labels, Vietnamese field labels, route breadcrumbs, empty-state copy, field-unavailable text | Presentation-only copy. No business record or status is implied. | Keep as UI copy. |
| Topic category labels | Static display labels for the fixed category enum from BR-F5.4. The selected category value itself comes from API. | Keep the label map, use API category value. |
| Item title/status placeholder when API value is null | Empty/null presentation state. No title or status is invented. | Replaced automatically when API provides the field. |
| Quiz correctness and resource content | No fixture in this read-only flow. | Read management detail response. |
| Quality score, completeness, publication readiness, progress and unsourced version details | Unsupported in this GET flow and not computed by the frontend. | Hidden until an API or approved derivation is available. |

Fixtures remain in the authoring prototypes under `types/topic-create.types.ts`. The read-only routes do not import those fixture values or use them after an API error.

## Request states and navigation

- Loading requests use a loading state.
- 401 and 403 responses show access states. 404 shows a missing-record state. Other failures show the API error message.
- Empty Item arrays and null/empty resources show empty states based on the actual response.
- Resource tab links preserve both Topic ID and stable Item ID, supporting direct links, refresh, back navigation and tab changes without form validation.
- Media renders only for persisted absolute HTTP(S) or root-relative URLs. Bare filenames are shown as unavailable values because the frontend has no authoritative base-path resolver for them.

## Automated verification

`npm run test:topic-management-read` covers the topic-scoped list/detail endpoints, response passthrough including quiz answer fields, ID encoding, GET method, 401/403/404 propagation, and rejected network requests without fixture fallback. Run `npm run lint` and `npm run build` for frontend checks.
