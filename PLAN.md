<!-- /autoplan restore point: /home/dev/.gstack/projects/enneitex-rancher-ui-extension/feat-improve-testing-autoplan-restore-20260331-092049.md -->

# Plan: Unit Tests for All Packages

**Branch:** feat/improve-testing
**Goal:** Add comprehensive unit tests to all packages (`compliance`, `monitoring`, `traefik`) to prevent future regressions.

## Context

Monorepo of Rancher UI Extensions v3 (Vue 3 + TypeScript). Extensions extend the Rancher Dashboard.

**Packages:**
- `pkg/compliance` — displays Kyverno/Kubewarden/Falco compliance reports
- `pkg/monitoring` — VictoriaMetrics monitoring UI (Grafana/VMAlert links, route receivers)
- `pkg/traefik` — custom UI for Traefik Proxy resources (IngressRoute, Middleware, etc.)

## Current State

- **1 existing test**: `pkg/traefik/formatters/__tests__/RoutesList.test.ts` (416 lines, well-written with `it.each`) — currently un-runnable (no jest.config.js)
- **No jest.config.js** in project root
- **No test script** in root `package.json`
- **Jest 27.5.1** available via `@rancher/shell` node_modules (transitive dep)
- **@vue/test-utils 2.4.6**, **@vue/vue3-jest 27.0.0**, **@babel/preset-typescript** available
- **TODOS.md P3** already calls for `victoria-metrics.js` tests

## Reference

Testing conventions from `rancher-dashboard/AGENTS.md`:
- Jest + TypeScript (`it.each`, `describe`, `toStrictEqual`, `toHaveBeenCalledWith`)
- `shallowMount` preferred over `mount`
- Tests in `__tests__/` directories, named `*.test.ts` / `.test.js`
- Cover happy path, unhappy path, edge cases (null, empty, large values)
- Each test case atomic — one assertion per `it` block

## Scope

### Infrastructure (required first)

1. **Root `package.json`**: Add `"@types/jest": "^27.5.2"` as devDependency (IDE support only — matches jest@27.5.1). Add script: `"test:ci": "node_modules/.bin/jest --testPathPattern=pkg/"`.

2. **`jest.config.js`** at root:
   ```js
   process.env.TZ = 'UTC';
   module.exports = {
     testEnvironment: 'jsdom',
     setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
     watchman: false,
     moduleFileExtensions: ['js', 'json', 'vue', 'ts'],
     moduleNameMapper: {
       '^@shell/(.*)$': '<rootDir>/node_modules/@rancher/shell/$1',
       '^~/(.*)$': '<rootDir>/$1',
       '^@/(.*)$': '<rootDir>/$1',
       '\\.(jpe?g|png|gif|webp|svg)$': '<rootDir>/node_modules/@rancher/shell/scripts/jest/svgTransform.js',
     },
     // CRITICAL: @rancher/shell uses ESM (import/export) — must transform
     transformIgnorePatterns: [
       '/node_modules/(?!@rancher/shell/)',
     ],
     transform: {
       '^.+\\.js$':   '<rootDir>/node_modules/babel-jest',
       '.*\\.(vue)$': '<rootDir>/node_modules/@vue/vue3-jest',
       '^.+\\.tsx?$': '<rootDir>/node_modules/babel-jest',  // babel handles TS via preset-typescript
     },
     testPathIgnorePatterns: ['<rootDir>/node_modules/'],
   };
   ```
   **Note:** Using `babel-jest` for TypeScript (via `@babel/preset-typescript`) instead of `ts-jest`. Rationale: `ts-jest@27` requires `@types/jest@^27` but `@types/jest@29` is the current package — incompatible peer deps. Babel approach uses already-installed `@babel/preset-typescript`, no new deps, and is how the existing `babel.config.js` in each package is set up.

3. **`jest.setup.js`** at root — minimal globals:
   ```js
   import { config } from '@vue/test-utils';
   config.global.mocks['t'] = (key) => key;
   config.global.mocks['$store'] = { getters: {}, dispatch: jest.fn() };
   ```

4. **`babel.config.js`** at root — add `@babel/preset-typescript` to test env:
   ```js
   module.exports = {
     presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
     env: {
       test: {
         presets: [
           ['@babel/preset-env', { targets: { node: 'current' } }],
           '@babel/preset-typescript',
         ],
         plugins: ['transform-require-context'],
       },
     },
   };
   ```

### Test Files to Create

#### pkg/compliance — focus on real logic

**`store/open-report/__tests__/mutations.test.ts`**

`updateLoadingReports`:
- toggles `true` / `false`

`updateReportsBatch` — ID-derivation edge cases (the key logic):
- `scope.namespace` + `scope.name` → key is `"ns/name"`
- only `scope.name` → key is `"name"`
- no scope, fallback to `report.id` → key is `report.id`
- update existing report (Object.assign in-place, no array growth)
- insert new report (push to array)
- `reportMap` is synced after batch

`removeReportById`:
- removes from `state.reports` array by id
- **does NOT remove from `reportMap`** — documents known stale-key behavior (existing bug, document not fix)
- no-op when id not found

**`modules/__tests__/openReports.test.ts`** — all exported pure functions:

`generateSummaryMap`:
- counts pass/fail/warn/error/skip correctly
- report with both namespace+name scope key
- report with only name scope key
- report with `scope: undefined`, id fallback — produces NO entry in summaryMap (documents 2-tier vs 3-tier divergence with mutations)
- unknown result type (`'exempted'`) → silently dropped (documents future-new-result-type risk)
- multiple reports for same resource (accumulates)
- empty reports array → empty map

`colorForResult` (all Result enum values + undefined):
- `pass`, `fail`, `warn`, `error`, `skip` → correct color
- `undefined` / unknown string → fallback color

`colorForSeverity` (all Severity enum values + undefined):
- `info`, `low`, `medium`, `high`, `critical` → correct color
- `undefined` / unknown → fallback

`severitySortValue`:
- ordering: `critical > high > medium > low > info`
- unknown severity → handled without throw

`isResourceNamespaced`:
- namespaced kind → `true`
- cluster-scoped kind → `false`

`__clearReportCache`:
- cache is cleared (subsequent `getReports` call hits store dispatch again)

#### pkg/monitoring

**`utils/__tests__/victoria-metrics.test.js`**

`loadVMConfigFromCluster`:
- ConfigMap found with all valid keys → returns parsed config
- missing ConfigMap (store dispatch returns null) → returns null
- invalid dns-label (contains `/`) → falls back to default
- **uppercase namespace (`'Monitoring'`)** → currently passes `/i` regex (documents bug: returns `'Monitoring'` not default)
- store dispatch throws → caught, returns null

`loadVMDashboardIdsFromCluster`:
- ConfigMap with custom IDs → returns custom values
- missing ConfigMap → returns hardcoded defaults

`generateVMUrl` (pure, no mock needed):
- builds correct proxy URL with clusterPrefix
- `clusterId === 'local'` → empty prefix

`dashboardExists`:
- `clusterId === 'local'` → correct URL without cluster prefix
- non-local clusterId → correct URL with `/k8s/clusters/...` prefix
- `uid` extracted from `dashboardId.split('/')[0]`

**Regex validation bug tests** (document-not-fix approach):
- `portNum` accepts `'0'` → currently passes, documents out-of-range acceptance

#### pkg/traefik

**`models/__tests__/traefik.io.ingressroute.test.js`**

Each test file uses inline `jest.mock()` for SteveModel:
```js
jest.mock('@shell/plugins/steve/steve-class', () => ({
  default: class SteveModel {
    constructor(data, ctx = {}) {
      Object.assign(this, data);
    }
    get namespace() { return this.metadata?.namespace; }
  }
}));
```
Test data MUST use `{ metadata: { name: '...', namespace: '...' }, spec: { ... } }` — NOT `{ name: '...' }` at top level (HybridModel.cleanHybridResources() strips top-level `name` in the real implementation).

`ingressClass` getter:
- annotation `kubernetes.io/ingress.class` present → returns it
- annotation absent → returns `''`

`details` getter:
- with `spec.entryPoints` + `ingressClass` → both in output
- `spec.entryPoints` empty → not included
- `spec` null → empty array

`_generateRelationships`:
- services array with namespace → `toId` uses `ns/svc`
- services with `kind === 'TraefikService'` → `toType: 'traefik.io.traefikservice'` (NOT `'service'`)
- middleware references in routes → include middleware relationships
- TLS `secretName` → secret relationship with correct `toType: 'secret'`
- TLS options → TLSOption relationship
- TLS store → TLSStore relationship
- **duplicate deduplication** — same secret from multiple routes appears once in output
- empty `spec.routes` → empty array

**`models/__tests__/traefik.io.middleware.test.js`**

`middlewareTypes` getter:
- spec with multiple keys → returns all keys
- spec with one key → single-item array
- spec null/empty → empty array

`primaryMiddlewareType`:
- returns first key or null

`hasMultipleTypes`:
- true/false boundary

`_generateRelationships` (secrets, not middlewares):
- `spec.basicAuth.secret` → produces secret relationship
- `spec.digestAuth.secret` → produces secret relationship
- `spec.rateLimit.redis.secret` → produces secret relationship
- **duplicate deduplication** — same secret referenced twice → one entry
- no matching keys → empty array

### Bug Fixes (added to scope — user decision)

1. **`pkg/compliance/store/open-report/mutations.ts`** — `removeReportById`: after removing from `state.reports`, also delete the scope-derived key from `state.reportMap`. Use same key-derivation logic as `updateReportsBatch`.

2. **`pkg/monitoring/utils/victoria-metrics.js`** — `dnsLabel` regex: remove `/i` flag → `const dnsLabel = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/`. Kubernetes labels must be lowercase.

3. **`pkg/monitoring/utils/victoria-metrics.js`** — `portNum` regex: replace `/^\d{1,5}$/` with `/^([1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/` (valid range 1-65535).

### Not in scope (this PR)

- E2E Cypress tests
- Vue component render tests for edit/list/detail pages AND formatters (`IngressHosts.vue`, `MiddlewareTypes.vue` etc. — same store mocking complexity as excluded pages)
- `actions.test.ts` for compliance store — actions are 2-line commit wrappers; real logic is in `generateSummaryMap`
- `processReportsInBatches` async tests (requestIdleCallback mock complexity)
- The existing `RoutesList.test.ts` (must not be overwritten per AGENTS.md)

### Deferred to TODOS.md

- `processReportsInBatches` tests (complex requestIdleCallback/setTimeout mocking)
- `removeReportById` stale-reportMap fix (tracked after tests document it)
- `dnsLabel` /i flag fix — accepts uppercase DNS labels (tracked after test documents it)
- Formatter Vue component tests (establish lighter mock infra first)

## Architecture

```
jest.config.js (root)
  ├── moduleNameMapper: @shell/* → node_modules/@rancher/shell/*
  ├── transformIgnorePatterns: ['/node_modules/(?!@rancher/shell/)']  ← CRITICAL
  ├── transform: babel-jest (*.ts + *.js), @vue/vue3-jest (*.vue)
  ├── testEnvironment: jsdom
  └── setupFilesAfterEnv: ['<rootDir>/jest.setup.js']

babel.config.js (root)
  └── test env: @babel/preset-typescript + transform-require-context

jest.setup.js (root)
  └── global mocks: t(), $store

pkg/compliance/modules/__tests__/openReports.test.ts
  ├── generateSummaryMap (7 cases)
  ├── colorForResult, colorForSeverity, severitySortValue
  └── isResourceNamespaced, __clearReportCache

pkg/compliance/store/open-report/__tests__/mutations.test.ts
  ├── updateLoadingReports
  ├── updateReportsBatch (6 edge cases — ID derivation)
  └── removeReportById (3 cases — documents stale-reportMap bug)

pkg/monitoring/utils/__tests__/victoria-metrics.test.js
  ├── loadVMConfigFromCluster (5 cases)
  ├── loadVMDashboardIdsFromCluster (2 cases)
  ├── generateVMUrl (2 cases — pure, no mock)
  └── dashboardExists (3 cases)

pkg/traefik/models/__tests__/traefik.io.ingressroute.test.js
  ├── jest.mock('@shell/.../steve-class') inline
  ├── ingressClass, details getters
  └── _generateRelationships (8 cases incl. TLS, middleware, TraefikService kind, dedup)

pkg/traefik/models/__tests__/traefik.io.middleware.test.js
  ├── jest.mock('@shell/.../steve-class') inline
  ├── middlewareTypes, primaryMiddlewareType, hasMultipleTypes
  └── _generateRelationships (5 cases — secret refs, dedup)
```

## Failure Modes Registry

| Failure | Impact | Mitigation in Plan |
|---------|--------|-------------------|
| `@rancher/shell` ESM not transformed | All tests crash | `transformIgnorePatterns` in jest.config.js |
| `__mocks__/@shell/` ignored by Jest | Model tests import real SteveModel → cascade crash | Use `jest.mock()` inline |
| ts-jest@27 + @types/jest@29 peer dep conflict | TS errors in tests, type checking broken | Use babel-jest + @babel/preset-typescript |
| `setupFilesAfterEnv` typo | Setup file never runs, mocks missing, opaque errors | Key verified in plan |
| removeReportById stale reportMap | Compliance badge shows stale data post-deletion | Documented by test, fix in TODOS |
| dnsLabel /i accepts uppercase | Proxy URL built with mixed-case service name → 404 | Documented by test, fix in TODOS |

## CEO Phase Notes

**Mode:** HOLD SCOPE

**Key decisions:**
- Prioritize pure function tests over Vuex boilerplate
- Jest 27 kept over Vitest (existing RoutesList.test.ts uses Jest, @rancher/shell provides it)
- babel-jest over ts-jest (avoids @types/jest version conflict, @babel/preset-typescript already installed)
- Formatter Vue component tests removed (same store mocking burden as edit/list/detail)
- Document-not-fix for 3 discovered bugs (removeReportById, dnsLabel /i, portNum)

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|---------|
| C1 | CEO | Redirect compliance tests to openReports.ts pure fns over store actions | Mechanical | P5+P1 | Actions are 1-line wrappers; real logic is in generateSummaryMap etc. | actions.test.ts |
| C2 | CEO | Add @shell/* moduleNameMapper to jest.config.js | Mechanical | P6 | Without this, every test importing @shell/* crashes on import | None viable |
| C3 | CEO | Remove IngressHosts.test.ts and MiddlewareTypes.test.ts | Mechanical | P5 | These are Vue SFCs needing store mocks; contradicted plan's own exclusion rule | Keep them |
| C4 | CEO | Add SteveModel mock to scope | Mechanical | P1 | Model class extends SteveModel; tests crash without a mock/stub | Skip model tests |
| C5 | CEO | Keep Jest 27 (not Vitest) | Mechanical | P3 | Existing test file uses Jest patterns; @rancher/shell provides it; switching is churn | Vitest |
| C6 | CEO | Remove actions.test.ts | Mechanical | P5+P1 | All 3 actions are commit-pass-throughs; permanently green = useless | Keep it |
| C7 | CEO | Add updateReportsBatch ID-derivation edge cases | Mechanical | P1 | ID key logic (namespace/name/id fallback) is silent regression surface | Basic only |
| C7b | CEO | Defer processReportsInBatches tests | Mechanical | P3 | requestIdleCallback mock complexity > value at this stage | Inline |
| E1 | Eng | Add transformIgnorePatterns to jest.config.js | Mechanical | P6 | @rancher/shell uses ESM — default Jest ignores node_modules transforms | None viable |
| E2 | Eng | Use jest.mock() inline instead of __mocks__/@shell/ directory | Mechanical | P5 | moduleNameMapper resolves to @rancher/shell path; __mocks__/@shell/ never found | __mocks__ dir |
| E3 | Eng | Use babel-jest + @babel/preset-typescript (no ts-jest) | Mechanical | P5+P3 | ts-jest@27 requires @types/jest@^27; @types/jest@29 incompatible; babel approach uses already-installed preset | ts-jest@27 |
| E4 | Eng | Fix typo: setupFilesAfterEnv not setupFilesAfterFramework | Mechanical | P6 | Typo causes setup file to never run | — |
| E5 | Eng | Add generateSummaryMap test for id-keyed reports | Mechanical | P1 | Documents divergence vs mutations (2-tier vs 3-tier key derivation) | Skip |
| E6 | Eng | Add removeReportById tests (stale reportMap — document, not fix) | Mechanical | P3 | Real bug, but this is a testing PR — document first, fix separately | Fix bug now |
| E7 | Eng | Expand SteveModel mock: HybridModel quirks, metadata/spec layout | Mechanical | P1 | HybridModel strips top-level keys; must use { metadata: {}, spec: {} } format | Simple spread |
| E8 | Eng | Fix middleware _generateRelationships description (secrets, not middlewares) | Mechanical | P5 | Function extracts secret refs, not middleware-to-middleware | Keep wrong desc |
| E9 | Eng | Add IngressRoute coverage: TLS, middleware, TraefikService kind, dedup | Mechanical | P1+P2 | In blast radius; function has 8+ distinct paths with silent type errors | Basic only |
| E10 | Eng | Add dnsLabel /i flag test (uppercase → currently not rejected) | Mechanical | P3 | Documents real validation bug; don't fix in this PR | Fix now |
| E11 | Eng | Add portNum out-of-range tests (0, 99999 currently accepted) | Mechanical | P3 | Documents validation gap; don't fix in this PR | Fix now |
| E12 | Eng | Add unknown result type test to generateSummaryMap | Mechanical | P1 | Future Kyverno result types would silently drop counts | Skip |
| E13 | Eng | Add dashboardExists to monitoring test scope | Mechanical | P2 | In blast radius; local vs non-local cluster branch is classic silent regression | Defer |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | clean | 7 issues auto-fixed |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | unavailable |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | clean | 13 issues auto-fixed |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | skipped | no UI scope |

**VERDICT:** Reviewed via /autoplan. 20 auto-decisions (all Mechanical). No User Challenges. No Taste Decisions requiring user input.
