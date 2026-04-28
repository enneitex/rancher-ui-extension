# E2E Testing Guide

Technical reference for writing Cypress E2E tests in this extension monorepo.
Based on [rancher-dashboard](https://github.com/rancher/dashboard/tree/master/cypress) conventions,
with lessons from [kubewarden-ui](https://github.com/rancher/kubewarden-ui/tree/main/tests) and
[rancher-ai-ui](https://github.com/rancher/rancher-ai-ui/tree/main/cypress).

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Running Tests](#running-tests)
3. [Page Object Model](#page-object-model)
4. [Writing Test Specs](#writing-test-specs)
5. [Custom Commands Reference](#custom-commands-reference)
6. [Blueprints (Fixtures)](#blueprints-fixtures)
7. [Selectors: data-testid Convention](#selectors-data-testid-convention)
8. [Tagging Strategy](#tagging-strategy)
9. [Resource Lifecycle Pattern](#resource-lifecycle-pattern)
10. [Intercepts and Mocking](#intercepts-and-mocking)
11. [Checklist Before Committing a Test](#checklist-before-committing-a-test)

---

## Directory Structure

```
cypress/
├── cypress.config.ts           # Config — env vars, specPattern, timeouts
├── support/
│   ├── e2e.ts                  # Entry point — imports all commands
│   ├── index.d.ts              # Augment Cypress namespace (custom types)
│   └── commands/               # Additional custom commands (extension-specific)
├── e2e/
│   ├── po/                     # Page Objects — one folder per extension, one file per UI surface
│   │   └── <extension>/
│   │       ├── <resource>-list.po.ts
│   │       ├── <resource>-form.po.ts
│   │       └── <resource>-<dialog>.po.ts
│   └── tests/                  # Spec files — mirror the po/ tree exactly
│       └── <extension>/
│           └── <resource>-<scenario>.spec.ts
├── fixtures/                   # Static JSON (rarely needed — prefer inline blueprints)
└── screenshots/                # Auto-generated on failure
```

**Rule:** one PO file per distinct UI surface (list page, create form, detail view, dialog).
Spec files go in the `tests/` tree, mirroring the `po/` tree.

---

## Running Tests

### Prerequisites

- Rancher instance running and fully bootstrapped (setup pages passed)
- Extension loaded into Rancher (dev mode or installed package)

### Quick start (interactive runner)

```bash
TEST_BASE_URL=https://rancher.127-0-0-1.sslip.io \
TEST_PASSWORD=adminadmin \
yarn cy:open
```

### Headless run (CI)

```bash
TEST_BASE_URL=https://rancher.127-0-0-1.sslip.io \
TEST_PASSWORD=adminadmin \
yarn cy:run
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TEST_BASE_URL` | `https://localhost:8005` | Dashboard URL |
| `TEST_USERNAME` | `admin` | Login username |
| `TEST_PASSWORD` | — | Login password (required) |
| `CATTLE_BOOTSTRAP_PASSWORD` | — | First-run bootstrap password (setup tests only) |
| `EXTENSION_DEV_URL` | `http://localhost:4500` | Dev server URL for dev-mode loading |

---

## Page Object Model

### Hierarchy

```
@rancher/cypress PagePo         ← navigation, waitForPage()
  └── BaseListPagePo            ← list(), masthead(), etc.
        └── IngressRouteListPo  ← domain-specific helpers

@rancher/cypress ComponentPo    ← self(), checkVisible(), shouldContainText()
  └── IngressRouteFormPo        ← form field methods
```

Use the Rancher base classes — do not build POs from scratch.
For concrete examples, refer to the existing POs in `cypress/e2e/po/`.

### Rules for POs

- **One method = one element action.** No business logic in POs.
- **Scope complex selectors.** Nested Tabbed components produce duplicate `data-testid` values — scope with `.routes-section` or `:visible` to disambiguate.
- **No assertions in POs** (except `checkVisible`, `checkExists` helpers from `ComponentPo`). Assertions belong in specs.
- **Static `goTo*` factory methods** for navigation so specs read as human-readable flows.

---

## Writing Test Specs

### File location and naming

```
cypress/e2e/tests/<extension>/<resource>-<scenario>.spec.ts

# Examples
cypress/e2e/tests/traefik/ingressroute-crud.spec.ts
cypress/e2e/tests/traefik/middleware-crud.spec.ts
cypress/e2e/tests/policy-report/report-tab.spec.ts
```

### Spec skeleton

```typescript
import SomeListPo from '../../po/traefik/some-list.po';
import SomeFormPo from '../../po/traefik/some-form.po';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// Blueprint factory — keep resource definitions close to the tests that use them.
function makeResource(name: string): object {
  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'SomeKind',
    metadata:   { name, namespace: NAMESPACE },
    spec:       { /* … */ },
  };
}

describe('SomeKind', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  describe('Create via form', () => {
    let resourceName: string;
    let removeResource = false;         // Flag prevents double-delete if test fails early.

    before(() => {
      cy.login();
      cy.createE2EResourceName('sk-create').then((name) => {
        resourceName = name;
      });
    });

    beforeEach(() => {
      cy.login();                       // Re-uses cached session (cy.session).
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.somekinds', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('fills in the form and creates the resource', () => {
      const form = new SomeFormPo(CLUSTER_ID);
      form.goTo();
      form.waitForPage();

      form.setName(resourceName);
      // … set other fields …
      form.save();

      const list = new SomeListPo(CLUSTER_ID);
      list.waitForPage();
      list.rowShouldExist(resourceName);
      removeResource = true;            // Only set after creation succeeds.
    });
  });

  describe('Edit via API + form round-trip', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('sk-edit').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.somekinds', makeResource(name));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.somekinds', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('edit form pre-fills existing values', () => {
      SomeFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);
      // assertions …
    });
  });

});
```

### Key structural rules

| Rule | Why |
|---|---|
| `testIsolation: 'off'` on the outer `describe` | Avoids unnecessary full page reloads between `it` blocks in the same suite |
| `before` for session setup, `beforeEach` for `cy.login()` | `before` runs once; `cy.login()` reuses the Cypress session cache |
| `after('clean up', …)` on every `describe` that creates resources | Leaves Rancher in a clean state for subsequent tests |
| Guard cleanup with `removeResource` flag | If creation fails mid-test the cleanup won't try to delete a non-existent resource |
| API assertions after form save | `cy.getRancherResource` verifies the *actual stored state*, not just the UI rendering |

---

## Custom Commands Reference

These commands come from `@rancher/cypress` and are available automatically via `cypress/support/e2e.ts`.

### Authentication

```typescript
// Login (creates a cy.session cache — subsequent calls are instant)
cy.login()
cy.login('admin', 'mypassword')
cy.login('admin', 'mypassword', /* cacheSession */ false)

cy.logout()
cy.clearAllSessions()
```

### Element selection

```typescript
// Primary selector — prefer this over cy.get when possible
cy.getId('form-save')                          // [data-testid="form-save"]
cy.getId('btn-', '^')                          // [data-testid^="btn-"]   (prefix match)
cy.getId('route', '$')                         // [data-testid$="route"]  (suffix match)
cy.getId('route', '*')                         // [data-testid*="route"]  (contains)

// Chained version (within a parent element)
cy.get('.modal').findId('confirm-button')

// Label-based selector (LabeledInput)
cy.byLabel('Name')                             // .labeled-input contains "Name" → input
```

### Resource CRUD

```typescript
// Read
cy.getRancherResource('v1', 'traefik.io.ingressroutes', 'default/my-route')
cy.getRancherResource('v1', 'traefik.io.ingressroutes')  // list

// Create
cy.createRancherResource('v1', 'traefik.io.ingressroutes', bodyObject)

// Update (full PUT)
cy.setRancherResource('v1', 'traefik.io.ingressroutes', 'default/my-route', bodyObject)

// Delete — set failOnStatusCode=false to ignore 404 in cleanup
cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', 'default/my-route', false)

// Poll until condition (useful for waiting for reconciliation)
cy.waitForRancherResource('v1', 'traefik.io.ingressroutes', 'default/my-route', (resp) => {
  return resp?.body?.status?.conditions?.some((c: any) => c.type === 'Ready');
})
```

**Resource type format:** `<group>.<kind-plural>` lowercased, e.g.:
- `traefik.io.ingressroutes`
- `traefik.io.middlewares`
- `traefik.io.tlsoptions`
- `reports.wgpolicyk8s.io.policyreports`

### Resource naming

```typescript
// Always use this for resource names — it stamps the run ID.
cy.createE2EResourceName('ir-create').then((name) => {
  // name = "e2e-test-1713456789-ir-create"
  resourceName = name;
});
```

Never hardcode resource names like `my-test-ingressroute`. Hardcoded names cause failures when tests are re-run without cleanup, and pollute Rancher with ambiguous stale resources.

---

## Blueprints (Fixtures)

Blueprints are TypeScript factory functions for API request bodies. They live next to the tests, not in `cypress/fixtures/` (which is for static JSON).

### Where to put them

```
cypress/e2e/tests/traefik/blueprints/ingressroutes.ts
cypress/e2e/tests/policy-report/blueprints/policyreports.ts
```

Or, for simple cases, define the factory inline at the top of the spec file (as in `ingressroute-crud.spec.ts`):

```typescript
function makeIngressRoute(name: string, match = 'Host(`e2e.example.com`)') {
  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'IngressRoute',
    metadata:   { name, namespace: NAMESPACE },
    spec:       {
      entryPoints: ['web'],
      routes:      [{ kind: 'Rule', match, services: [{ name: 'kubernetes', port: 443 }] }],
    },
  };
}
```

Promote to a dedicated file once the same blueprint is used in more than one spec.

### CYPRESS_SAFE_RESOURCE_REVISION

When mocking list responses with `cy.intercept`, always set the `revision` / `resourceRevision`
fields to a high value to prevent the UI from entering an infinite refetch loop:

```typescript
// blueprints/utils.ts
export const CYPRESS_SAFE_RESOURCE_REVISION = 999999999;

// In your intercept:
cy.intercept('GET', '/v1/traefik.io.ingressroutes*', {
  body: {
    type:             'collection',
    resourceRevision: CYPRESS_SAFE_RESOURCE_REVISION,
    data:             [/* mock items */],
  }
}).as('listIngressRoutes');
```

**Why:** the Rancher shell watches resources over WebSocket. A too-low revision causes the
server to reject the watch, the UI re-fetches, gets the same low revision, and loops forever
with 100% CPU.

---

## Selectors: data-testid Convention

### Priority order

1. `[data-testid="…"]` — always prefer this
2. Role + label: `cy.contains('button', 'Save')` — acceptable for generic Rancher buttons
3. CSS class — only when `data-testid` is absent and adding it is impractical
4. Element type — never use alone (too fragile)

### Rancher shell known testids

| Component | Selector | Notes |
|---|---|---|
| Name input (NameNsDescription) | `[data-testid="NameNsDescriptionNameInput"]` | Present on all create/edit forms |
| CruResource save button | `[data-testid="form-save"]` | Default `componentTestid="form"` |
| Tab button | `[data-testid="btn-{tabName}"]` | `tabName` is the `name` prop of `<Tab>` |
| Tab add button | `[data-testid="tab-list-add"]` | Visible when `show-tabs-add-remove` |
| Tab remove button | `[data-testid="tab-list-remove"]` | |
| Action menu row item | via `actionMenu(rowName).getMenuItem('Delete')` | Use the PO helper |
| Delete confirm dialog | `PromptRemove.remove()` | Import from `@rancher/cypress` |

### Adding testids to extension components

When a selector is missing, add it to the Vue component:

```html
<!-- Simple element -->
<button data-testid="my-extension-submit">Submit</button>

<!-- Dynamic list (use index or unique value) -->
<li
  v-for="(item, i) in items"
  :key="item.id"
  :data-testid="`my-extension-item-${ i }`"
>

<!-- Composable prefix via prop -->
<MyComponent :componentTestid="'ingressroute-rules'" />
<!-- → generates [data-testid="ingressroute-rules-..."] inside -->
```

---

## Tagging Strategy

Tags control which tests run in which CI job. They are defined on the outer `describe`:

```typescript
describe('IngressRoute', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {
```

### Current tags

| Tag | Meaning |
|---|---|
| `@adminUser` | Must run as Rancher admin |
| `@standardUser` | Must run as a standard (non-admin) user |
| `@traefik` | Traefik extension tests |
| `@policyReport` | Policy Report extension tests |

### Running by tag (locally)

```bash
GREP_TAGS=@traefik TEST_PASSWORD=adminadmin yarn cy:run
GREP_TAGS="@traefik @adminUser" TEST_PASSWORD=adminadmin yarn cy:run  # AND
```

### Adding a new tag

1. Add it to the `describe` block in the spec.
2. Document it in the table above.
3. If the tag maps to a CI matrix entry, update `.github/workflows/e2e.yml`.

---

## Resource Lifecycle Pattern

Every test suite that creates resources **must** clean up after itself, even on failure.

### Pattern used throughout this project

```typescript
describe('Create via form', () => {
  let resourceName: string;
  let removeResource = false;   // ← guard flag

  before(() => {
    cy.login();
    cy.createE2EResourceName('context').then((name) => {
      resourceName = name;
    });
  });

  beforeEach(() => {
    cy.login();                 // refreshes cached session
  });

  after('clean up', () => {
    if (removeResource) {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NS }/${ resourceName }`, false);
    }
  });

  it('creates the resource', () => {
    // … test …
    removeResource = true;      // ← only set after successful creation
  });
});
```

**Why the flag:** if the test fails before the resource is created, `after` still runs but
finds nothing to delete. Setting the flag only after creation avoids the 404 error.

### API-created resources

When creating resources via API in `before` (not via UI), set the flag immediately:

```typescript
before(() => {
  cy.login();
  cy.createE2EResourceName('edit').then((name) => {
    resourceName = name;
    cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeResource(name));
    removeResource = true;     // API call is synchronous within cy chain
  });
});
```

---

## Intercepts and Mocking

Prefer real API calls over mocking. Mocks are brittle and hide real integration issues.

Use intercepts only when:
- Testing error states (mock a 5xx response)
- Testing large datasets at scale (mock 100+ items)
- The resource type does not exist in the test environment

### Intercept pattern

```typescript
it('shows an error banner when the API fails', () => {
  cy.intercept('GET', '/v1/traefik.io.ingressroutes*', { statusCode: 503 }).as('listFail');

  const list = new IngressRouteListPo('local');
  list.goTo();
  cy.wait('@listFail');

  cy.getId('error-banner').should('be.visible');
});
```

### Mock list response with safe revision

```typescript
import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprints/utils';

cy.intercept('GET', '/v1/traefik.io.ingressroutes*', {
  body: {
    type:             'collection',
    resourceRevision: CYPRESS_SAFE_RESOURCE_REVISION,
    data: [
      makeIngressRoute('mock-route-1'),
      makeIngressRoute('mock-route-2'),
    ],
  }
}).as('listMocked');
```

---

## Checklist Before Committing a Test

- [ ] Test uses `cy.createE2EResourceName` — no hardcoded resource names.
- [ ] `after('clean up')` block exists with `cy.deleteRancherResource(..., false)`.
- [ ] Cleanup guarded by a `removeResource` flag.
- [ ] `testIsolation: 'off'` on the outer `describe` (avoids needless reloads).
- [ ] `beforeEach` calls `cy.login()` to refresh the cached session.
- [ ] Tags include at least `@adminUser` or `@standardUser` + the extension tag.
- [ ] New `data-testid` attributes added to Vue components where needed.
- [ ] No hardcoded waits (`cy.wait(2000)`). Use `waitForPage()`, `checkVisible()`, or `cy.waitForRancherResource`.
- [ ] API assertions (`cy.getRancherResource`) used to verify persisted state, not just UI state.
- [ ] Mock responses include `CYPRESS_SAFE_RESOURCE_REVISION` if using `cy.intercept` for lists.
- [ ] Test runs green locally with `yarn cy:run` before pushing.
