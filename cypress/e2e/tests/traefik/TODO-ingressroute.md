# TODO — IngressRoute e2e coverage

All tests tagged `@traefik @adminUser`. Resources created via API unless the test
specifically exercises the UI form. Cleanup in `after()` hooks via `cy.deleteRancherResource`.

## POs needed

| PO | File | Status |
|----|------|--------|
| `IngressRouteListPo` | `po/traefik/ingressroute-list.po.ts` | ✅ done |
| `IngressRouteFormPo` | `po/traefik/ingressroute-form.po.ts` | ⬜ |
| `IngressRouteDetailPo` | `po/traefik/ingressroute-detail.po.ts` | ⬜ |

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

- [ ] Row action menu contains Edit, Clone, Download YAML, Delete
- [ ] Clicking a row navigates to the detail view
- [ ] Clicking the resource name navigates to the detail view

---

## 2. Create form

**Spec**: `ingressroute-create.spec.ts`

### 2.1 Form renders correctly
- [ ] Clicking Create opens the edit form
- [ ] All expected tabs are present: Entry Points, Routes, TLS, IngressClass, Labels & Annotations

### 2.2 Entry Points tab
- [ ] Default entry point "websecure" is pre-selected
- [ ] Can select additional entry point "web"
- [ ] Can remove an entry point
- [ ] Validation: submitting with no entry points shows error banner

### 2.3 Routes tab — basic route
- [ ] Routes tab shows one route by default
- [ ] Can type a match rule (`Host(\`e2e-test.example.com\`)`)
- [ ] Can type a service name in the service row
- [ ] Can select a service port
- [ ] Auto-fill: selecting an existing service pre-fills the first available port

### 2.4 Routes tab — multiple routes
- [ ] Can add a second route (button appears, new tab is created)
- [ ] Each route tab can have its own match rule and services
- [ ] Can remove the second route (tab disappears)
- [ ] Removing last route is not possible (no remove button on single route)

### 2.5 Routes tab — services
- [ ] Can add a second service within a route
- [ ] Can remove a service from a route (when more than one)
- [ ] Port field is visible for k8s services
- [ ] Validation: submitting without service name shows error

### 2.6 Routes tab — middlewares
- [ ] Middleware field is absent when no Middlewares exist in the cluster
- [ ] (When middleware exists) Can select a middleware for a route
- [ ] (When middleware exists) Can remove a middleware from a route

### 2.7 TLS tab
- [ ] TLS is disabled by default
- [ ] Enabling TLS reveals secret and options fields
- [ ] Can select a TLS secret from the dropdown
- [ ] Can type a certificate resolver name
- [ ] Can add a TLS domain with a `main` value
- [ ] Can add a SAN to a TLS domain
- [ ] Disabling TLS hides the fields again

### 2.8 IngressClass tab
- [ ] IngressClass dropdown is present (may be empty in test env)
- [ ] Selecting an IngressClass stores it in `metadata.annotations`

### 2.9 Full create flow
- [ ] Can fill in name, namespace, entry point, match rule, service, port and save
- [ ] After save, redirects to list or detail view
- [ ] New resource appears in the list

### 2.10 Validation
- [ ] Submitting empty form shows all required field errors
- [ ] Match rule empty → validation error on route tab
- [ ] Service name empty → validation error on route tab
- [ ] Entry points empty → validation error on entry points tab

---

## 3. Edit form

**Spec**: `ingressroute-edit.spec.ts`

- [ ] Opening edit form pre-fills all existing values (entry points, routes, services)
- [ ] Can modify the match rule of an existing route and save
- [ ] Can add a new route to an existing IngressRoute and save
- [ ] Can remove a route from an existing IngressRoute and save
- [ ] Can change the service name in an existing route and save
- [ ] Can enable TLS on an IngressRoute that had none, and save
- [ ] Changes persist after navigation away and back

---

## 4. Detail view

**Spec**: `ingressroute-detail.spec.ts`

- [ ] Detail view shows the resource name in the masthead
- [ ] Routes tab is visible and shows the match rule
- [ ] Routes tab shows service name(s) as links
- [ ] Routes tab shows middleware names when configured
- [ ] TLS tab shows "Not configured" or certificate details
- [ ] Resources tab shows relationships (services, secrets)
- [ ] Edit button in masthead navigates to the edit form
- [ ] Delete button in masthead opens confirmation dialog

---

## 5. Delete

**Spec**: shared in `ingressroute-crud.spec.ts` or inline `after()` cleanup

- [ ] Delete from list action menu opens confirmation dialog
- [ ] Confirming deletion removes the resource from the list
- [ ] Cancelling deletion keeps the resource
- [ ] Delete from detail view masthead opens confirmation and redirects to list

---

## 6. YAML

- [ ] Download YAML from action menu downloads valid YAML
- [ ] Can open YAML editor via "Edit YAML" action
- [ ] Editing YAML and saving reflects changes in the detail view
