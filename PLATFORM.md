# Frontend Platform Blueprint

This document defines how `doc-portal` should evolve from a product frontend into an extensible platform that third-party developers can build on.

## 1. Modular Architecture Plan

## 1.1 Target Module Layout

```text
src/
  core/
    app-shell/
    auth/
    permissions/
  features/
    chatbot/
      ui/
      state/
      renderers/
      persistence/
    documents/
    users/
    roles/
  integrations/
    api-clients/
    analytics/
  extensions/
    registry.ts
    contracts.ts
```

## 1.2 Rules

- `core/*` contains framework-level concerns (layout, auth context, route guards).
- `features/*` contains business capabilities with explicit boundaries.
- `integrations/*` contains adapters to backend APIs and external services.
- `extensions/*` defines stable extension contracts and runtime registration.

## 2. Plugin / Extension Strategy

## 2.1 Extension Contracts

Define extension points with strict interfaces:

- **Chat renderers**: register custom renderer for message types.
- **Sidebar modules**: register menu items with permission + feature-flag metadata.
- **Post-processing hooks**: transform assistant messages before render.

Example contract (conceptual):

```ts
export type ChatRendererPlugin = {
  id: string;
  supports: (message: AssistantMessage) => boolean;
  render: (message: AssistantMessage) => React.ReactNode;
};
```

## 2.2 Registration

- Maintain a single extension registry (`extensions/registry.ts`).
- Register platform-native plugins first, community plugins second.
- Resolve collisions by deterministic priority.

## 2.3 Safety

- Disallow side effects during plugin registration.
- Keep plugin APIs pure and serializable where possible.
- Gate plugin execution behind feature flags.

## 3. API Design Improvements for Extensibility

Although this repository is frontend-first, it should consume API contracts as a platform client:

- Generate and centralize typed DTOs for all API endpoints.
- Introduce one normalized error envelope mapper in `integrations/api-clients`.
- Add version-aware client functions (`v1`, future `v2`) to avoid breaking extension consumers.
- Add event-friendly client contracts for future webhook/event-stream use cases.

## 4. Integration Model for External Developers

## 4.1 Embeddable UI

- Expose a reusable `<ChatWidget />` package entrypoint.
- Allow host apps to inject:
  - API base URL
  - theme tokens
  - auth token resolver
  - renderer plugins

## 4.2 Stable Theming Surface

- Move design tokens into a documented token map.
- Support token override through provider props.
- Keep UI primitives independent from app route context.

## 4.3 Integration Documentation

Provide docs for:

- Bootstrapping widget in another Next.js app
- Using custom renderer plugin
- Injecting auth/session strategy
- Upgrading across minor versions

## 5. Rollout Plan

1. Extract chatbot into `features/chatbot` package-like module.
2. Introduce extension registry with default internal plugins.
3. Add typed API client layer and remove ad-hoc fetch calls from UI components.
4. Publish integration docs and starter examples.

This plan preserves current behavior while enabling external contribution and extension without forking core UI code.
