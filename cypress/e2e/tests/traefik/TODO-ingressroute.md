# TODO — IngressRoute e2e coverage

All tests tagged `@traefik @adminUser`. Resources created via API unless the test
specifically exercises the UI form. Cleanup in `after()` hooks via `cy.deleteRancherResource`.

## POs needed

| PO | File | Status |
|----|------|--------|
| `IngressRouteListPo` | `po/traefik/ingressroute-list.po.ts` | ✅ done |
| `IngressRouteFormPo` | `po/traefik/ingressroute-form.po.ts` | ✅ done |
| `IngressRouteDetailPo` | `po/traefik/ingressroute-detail.po.ts` | ✅ done |

> **Note on selectors**: the extension's custom components (Routes, ServiceRow, TLSConfiguration)
> currently lack `data-testid` attributes. Tests below that interact with the form fields
> use structural/label-based selectors. Adding `data-testid` to these components would make
> the tests more robust. See `pkg/traefik/components/Route.vue`, `ServiceRow.vue`.

---

## 1. Navigation & list view

**Spec**: `navigation.spec.ts`

- [x] List page is reachable at `/c/local/explorer/traefik.io.ingressroute`
- [x] Masthead Create button is present (`isCreatable: true`)
- [x] Traefik side-nav group is visible in Cluster Explorer
- [x] Resource created via API appears in the list table
- [x] Entry-point column shows the correct value

- [x] Row action menu contains Edit, Clone, Download YAML, Delete
- [x] Clicking a row navigates to the detail view
- [x] Clicking the resource name navigates to the detail view

---

## 2. Create form

**Spec**: `ingressroute-create.spec.ts`

### 2.1 Form renders correctly
- [x] Clicking Create opens the edit form
- [x] All expected tabs are present: Entry Points, Routes, TLS, IngressClass, Labels & Annotations

### 2.2 Entry Points tab
- [x] Default entry point "websecure" is pre-selected
- [x] Can select additional entry point "web"
- [x] Can remove an entry point
- [x] Validation: submitting with no entry points shows error banner

### 2.3 Routes tab — basic route
- [x] Routes tab shows one route by default
- [x] Can type a match rule (`Host(\`e2e-test.example.com\`)`)
- [x] Can type a service name in the service row
- [x] Can select a service port
- [ ] Auto-fill: selecting an existing service pre-fills the first available port

### 2.4 Routes tab — multiple routes
- [x] Can add a second route (button appears, new tab is created)
- [x] Each route tab can have its own match rule and services
- [x] Can remove the second route (tab disappears)
- [x] Removing last route is not possible (no remove button on single route)

### 2.5 Routes tab — services
- [x] Can add a second service within a route
- [ ] Can remove a service from a route (when more than one)
- [x] Port field is visible for k8s services
- [ ] Validation: submitting without service name shows error

### 2.6 Routes tab — middlewares
- [x] Middleware field is absent when no Middlewares exist in the cluster
- [ ] (When middleware exists) Can select a middleware for a route
- [ ] (When middleware exists) Can remove a middleware from a route

### 2.7 TLS tab
- [x] TLS is disabled by default
- [x] Enabling TLS reveals secret and options fields
- [ ] Can select a TLS secret from the dropdown
- [x] Can type a certificate resolver name
- [x] Can add a TLS domain with a `main` value
- [x] Can add a SAN to a TLS domain
- [x] Disabling TLS hides the fields again

### 2.8 IngressClass tab
- [x] IngressClass dropdown is present (may be empty in test env)
- [ ] Selecting an IngressClass stores it in `metadata.annotations`

### 2.9 Full create flow
- [x] Can fill in name, namespace, entry point, match rule, service, port and save
- [x] After save, redirects to list or detail view
- [x] New resource appears in the list

### 2.10 Validation
- [ ] Submitting empty form shows all required field errors
- [ ] Match rule empty → validation error on route tab
- [ ] Service name empty → validation error on route tab
- [x] Entry points empty → validation error on entry points tab

---

## 3. Edit form

**Spec**: `ingressroute-edit.spec.ts`

- [x] Opening edit form pre-fills all existing values (entry points, routes, services)
- [x] Can modify the match rule of an existing route and save
- [x] Can add a new route to an existing IngressRoute and save
- [x] Can remove a route from an existing IngressRoute and save
- [x] Can change the service name in an existing route and save
- [x] Can enable TLS on an IngressRoute that had none, and save
- [x] Changes persist after navigation away and back

---

## 4. Detail view

**Spec**: `ingressroute-detail.spec.ts`

- [x] Detail view shows the resource name in the masthead
- [x] Routes tab is visible and shows the match rule
- [x] Routes tab shows service name(s) as links
- [ ] Routes tab shows middleware names when configured
- [x] TLS tab shows "Not configured" or certificate details
- [ ] Resources tab shows relationships (services, secrets)
- [x] Edit button in masthead navigates to the edit form
- [x] Delete button in masthead opens confirmation dialog

---

## 5. Delete

**Spec**: shared in `ingressroute-crud.spec.ts` or inline `after()` cleanup

- [x] Delete from list action menu opens confirmation dialog
- [x] Confirming deletion removes the resource from the list
- [x] Cancelling deletion keeps the resource
- [x] Delete from detail view masthead opens confirmation and redirects to list

---

## 6. YAML

**Spec**: `ingressroute-crud.spec.ts`

- [ ] Download YAML from action menu downloads valid YAML
- [x] Can open YAML editor via "Edit YAML" action
- [x] YAML editor contains the resource kind and name
- [ ] Editing YAML and saving reflects changes in the detail view
