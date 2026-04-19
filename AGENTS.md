# AGENTS.md

## Repository Context

This repository is a Rancher UI extension.

Key runtime and tooling:
- extension package built on `@rancher/shell`
- E2E tests written with Cypress
- shared Rancher test helpers come from `@rancher/cypress`

Important paths:
- `docs/e2e-testing-guide.md`: main local reference for E2E conventions
- `docs/e2e-traefik-review.md`: in-depth review of the current Traefik E2E suite
- `cypress/e2e/po/traefik/`: Traefik page objects
- `cypress/e2e/tests/traefik/`: Traefik E2E specs
- `cypress/support/e2e.ts`: imports Rancher Cypress commands

## E2E Conventions

When working on Cypress tests in this repo, follow `docs/e2e-testing-guide.md`.

Core expectations:
- prefer Rancher base classes from `@rancher/cypress`
- keep Page Objects thin: one method per element action, no business logic
- prefer `cy.getId(...)` and `cy.byLabel(...)` over ad hoc selectors when possible
- use `cy.createE2EResourceName(...)` for test resources
- use `testIsolation: 'off'` on the outer `describe`
- use `before(() => cy.login())` and `beforeEach(() => cy.login())`
- always clean up created resources with `after('clean up', ...)`
- guard cleanup with a boolean flag such as `removeResource`
- avoid hardcoded waits; prefer `waitForPage()`, visibility checks, or Rancher resource polling
- prefer API assertions with `cy.getRancherResource(...)` to verify persisted state

## Commands

Common local commands:

```bash
yarn build
yarn cy:open
yarn cy:run
```

Typical E2E environment variables:

```bash
TEST_BASE_URL=https://rancher.127-0-0-1.sslip.io
TEST_PASSWORD=adminadmin
```

## Working Style

Prefer minimal, pattern-aligned changes.

When adding or updating tests:
- reuse existing POs and blueprints before adding new helpers
- if a spec needs a DOM interaction not covered by a PO, prefer extending the PO instead of inlining selectors in the spec
- do not introduce mocks unless the scenario really requires them
- keep spec structure consistent with the Rancher Dashboard style used in this repo
