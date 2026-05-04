# Contributing to Smart Doc Portal (Frontend)

Thank you for contributing. This repository is maintained as an open-source, extensible frontend platform built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## Table of Contents

1. Prerequisites
2. Local Setup
3. Development Workflow
4. Run, Test, and Debug
5. Engineering Standards
6. Adding New Features or Modules
7. Pull Request Checklist
8. Communication and Collaboration

## 1. Prerequisites

- Node.js 20+
- npm 10+
- Running backend API (`go-api`) reachable from this app

## 2. Local Setup

1. Fork this repository and clone your fork.
2. Install dependencies.

```bash
npm install
```

3. Create `./.env.local`.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
API_BASE_URL=http://localhost:8080
PERMISSION_API_URL=http://localhost:8080/api/permissions/resolve
```

Notes:
- `NEXT_PUBLIC_API_BASE_URL` is used by client and server routes.
- `API_BASE_URL` is optional; if not set, server routes fall back to `NEXT_PUBLIC_API_BASE_URL`.
- `PERMISSION_API_URL` is optional; if not set, app layout derives it from `NEXT_PUBLIC_API_BASE_URL`.

4. Start the development server.

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## 3. Development Workflow

### Branch Strategy

- Base branch: `main`
- Branch from latest `main`
- Keep branches short-lived and focused on one change

Branch naming:

- `feat/<scope>-<short-description>`
- `fix/<scope>-<short-description>`
- `docs/<scope>-<short-description>`
- `refactor/<scope>-<short-description>`
- `chore/<scope>-<short-description>`

Examples:

- `feat/chatbot-history-search`
- `fix/auth-cookie-redirect`
- `docs/contributing-guide`

### Commit Convention (Conventional Commits)

Use:

```text
<type>(<scope>): <summary>
```

Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`.

Examples:

- `feat(chatbot): add grouped conversation history`
- `fix(auth): handle expired jwt redirect`
- `docs(readme): document api proxy behavior`

## 4. Run, Test, and Debug

### Core Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

### Current Test Status

- There is currently no first-party automated FE test suite in this repository.
- Until test infrastructure is added, PRs must include a manual validation checklist.

### Local Debugging

- Use `npm run dev` for stack traces and route handler errors.
- Inspect browser DevTools network tab for:
  - `/api/auth/login`
  - `/api/rag/query`
  - `/api/rag/source/:documentId`
- Validate middleware-protected route behavior (`/dashboard`, `/chatbot`, `/users`, `/roles`, `/permissions`, `/docs`).

## 5. Engineering Standards

### Code Style

- TypeScript strict mode is required; avoid `any` unless justified and documented.
- Prefer small, composable React components.
- Keep route handlers thin; place reusable logic in `src/lib/*`.
- Use descriptive names:
  - Components: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
- Keep API request/response contracts typed in `src/lib/*`.
- Prefer server-side route handlers for backend calls requiring auth/cookies.

### Formatting and Linting

- Lint must pass before opening PR:

```bash
npm run lint
```

### Backward Compatibility

- Do not break existing API contracts consumed by current pages.
- Preserve existing auth/session behavior unless change is intentional and documented.

## 6. Adding New Features or Modules

Use this architecture sequence for new capabilities:

1. Define data contract types in `src/lib/*`.
2. Add or extend Next.js API route handlers in `src/app/api/*`.
3. Build UI in the correct route group:
   - Public routes: `src/app/(public)`
   - Protected routes: `src/app/(app)`
4. If feature is protected, add/update permission-based nav in `src/config/sidebar.config.ts`.
5. Keep cross-cutting logic reusable in `src/lib/*` or `src/components/*`.
6. Update `README.md` and docs if behavior or setup changed.

### Module Boundaries

- `src/app/api/*`: server route adapters/proxies only
- `src/lib/*`: domain utilities, request helpers, DTOs
- `src/components/*`: reusable UI primitives/containers
- `src/app/(app)/*`: authenticated product surfaces

## 7. Pull Request Checklist

Before requesting review, ensure all items are complete:

- [ ] Branch name follows strategy
- [ ] Commits follow Conventional Commits
- [ ] `npm run lint` passes
- [ ] `npm run build` passes locally
- [ ] Manual QA steps documented in PR description
- [ ] Documentation updated (README/CONTRIBUTING/docs) where relevant
- [ ] Screenshots or recordings added for visible UI changes
- [ ] Backward compatibility impact assessed and documented
- [ ] No secrets or environment-specific values committed

## 8. Communication and Collaboration

### Issues

- Use issue templates for bug reports and feature requests.
- One problem per issue.
- Include reproduction details and expected behavior.

### Discussions and Design Proposals

Create a GitHub Discussion or issue proposal before implementing:

- New architectural pattern
- New cross-cutting dependency
- Any breaking user-facing behavior

### Review Expectations

- Be respectful, specific, and actionable.
- Reviewers should request changes with concrete guidance.
- Contributors should respond with follow-up commits, not force-push history rewrites unless requested.

---

By contributing, you agree to keep this project stable, secure, and friendly for the next contributor.
