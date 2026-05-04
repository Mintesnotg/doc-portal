# Frontend Issue Backlog

This backlog is curated for maintainers to create high-quality GitHub issues quickly.

## Recommended Label Set

- `enhancement`: user-facing feature work
- `good first issue`: narrow scope, low risk
- `help wanted`: maintainers welcome community implementation
- `area:chatbot`, `area:auth`, `area:ui`, `area:dx`: domain labels
- `priority:p1`, `priority:p2`, `priority:p3`: priority labels

---

## FE-001: Pluggable Assistant Response Renderers

**Labels:** `enhancement`, `area:chatbot`, `help wanted`, `priority:p1`

### Description

Introduce a renderer registry so assistant responses can be rendered by content type (markdown, code snippet, table, citation block, custom card) without hardcoding logic inside `chatbot-client.tsx`.

### Acceptance Criteria

- [ ] `chatbot-client` delegates assistant content rendering to a registry/adapter layer.
- [ ] Default renderer supports existing markdown headings/lists behavior.
- [ ] New renderer can be registered without editing core chat component.
- [ ] Existing responses remain backward compatible.
- [ ] Contributor docs include how to add a custom renderer.

### Technical Hints

- Add `src/features/chatbot/renderers/*` with a typed `Renderer` interface.
- Use discriminated unions or metadata heuristics for renderer selection.
- Keep `renderAssistantContent` as fallback renderer.

---

## FE-002: Conversation Export and Import

**Labels:** `enhancement`, `area:chatbot`, `good first issue`, `priority:p2`

### Description

Allow users to export one conversation or all history to JSON and import it later. This improves portability and enables external tooling.

### Acceptance Criteria

- [ ] Add `Export` action for current conversation.
- [ ] Add `Export all` action for all conversation history.
- [ ] Add `Import` action with file validation.
- [ ] Imported data merges safely without duplicate IDs.
- [ ] Clear user feedback for success/failure states.

### Technical Hints

- Reuse current persisted structure (`version`, `conversations`, `activeConversationId`).
- Add schema validation before writing to localStorage.
- Keep import logic in a dedicated utility module.

---

## FE-003: Search Result Highlighting in History and Messages

**Labels:** `enhancement`, `area:chatbot`, `help wanted`, `priority:p2`

### Description

Upgrade search UX so matching text is highlighted in history cards and within message bodies when a history search is active.

### Acceptance Criteria

- [ ] Matching terms are highlighted in history title/preview.
- [ ] Optional in-chat highlighting for the active conversation.
- [ ] Case-insensitive matching and escaped special characters.
- [ ] No runtime errors with empty or malformed queries.

### Technical Hints

- Extract reusable `highlightMatches(text, query)` utility.
- Avoid `dangerouslySetInnerHTML`; build tokenized React nodes.
- Keep performance stable with memoization.

---

## FE-004: Permission-aware Feature Flags in Sidebar and Routes

**Labels:** `enhancement`, `area:auth`, `area:ui`, `help wanted`, `priority:p1`

### Description

Introduce a feature-flag layer on top of permission checks so maintainers can enable/disable experimental modules without backend permission schema changes.

### Acceptance Criteria

- [ ] Feature flags loaded from env or static config.
- [ ] Sidebar hides disabled modules even when permission exists.
- [ ] Route guard redirects safely for disabled modules.
- [ ] Documented flag naming convention and rollout steps.

### Technical Hints

- Add a `featureFlags.ts` helper and consume it in sidebar filtering.
- Keep permission and feature checks orthogonal.
- Add SSR-safe fallback behavior for missing flags.

---

## FE-005: Contributor E2E Harness for Auth + Chatbot Core Flows

**Labels:** `enhancement`, `area:dx`, `help wanted`, `priority:p1`

### Description

Add an end-to-end test harness that validates critical flows (login, protected route access, chat send/stop/retry, history persistence) to reduce regression risk for community contributions.

### Acceptance Criteria

- [ ] Add Playwright setup with at least one CI-ready browser profile.
- [ ] Cover login success/failure flow.
- [ ] Cover chatbot send, retry, and history persistence flow.
- [ ] Include contributor docs for running tests locally.
- [ ] Tests run in headless mode via one npm command.

### Technical Hints

- Mock backend responses for deterministic E2E where needed.
- Keep test fixtures isolated from production `.env.local`.
- Prefer stable selectors (`data-testid`) for long-term maintainability.
