# TODO — IngressRouteTCP e2e coverage

All tests tagged `@traefik @adminUser`. Resources created via API unless the test
specifically exercises the UI form.

## POs needed

| PO | File | Status |
|----|------|--------|
| `IngressRouteTCPListPo` | `po/traefik/ingressroutetcp-list.po.ts` | ⬜ |
| `IngressRouteTCPFormPo` | `po/traefik/ingressroutetcp-form.po.ts` | ⬜ |
| `IngressRouteTCPDetailPo` | `po/traefik/ingressroutetcp-detail.po.ts` | ⬜ |

> Reuse `IngressRouteFormPo` base class where possible — the form structure is the same,
> only entry point input and TLS passthrough differ.

---

## 1. Navigation & list view

**Spec**: `ingressroutetcp-navigation.spec.ts`

- [ ] List page reachable at `/c/local/explorer/traefik.io.ingressroutetcp`
- [ ] Masthead Create button present
- [ ] IngressRouteTCP item visible in Traefik side-nav group
- [ ] Resource created via API appears in list
- [ ] Entry-point column shows correct value

---

## 2. Create form

**Spec**: `ingressroutetcp-create.spec.ts`

### 2.1 Entry Points tab — free-form input
- [ ] Entry points are typed as tags (not a predefined dropdown)
- [ ] Can type a custom entry point name and confirm with Enter
- [ ] Can add multiple entry points
- [ ] Can remove an entry point tag

### 2.2 Routes tab
- [ ] Default match is `HostSNI(\`*\`)` (TCP default)
- [ ] Can modify the match rule
- [ ] Port field is always required for TCP services (unlike HTTP)
- [ ] Validation: missing port → error (TCP services always require port)
- [ ] Can add multiple services to a route

### 2.3 Middlewares (TCP)
- [ ] Middleware dropdown shows only `MiddlewareTCP` resources (not HTTP middlewares)

### 2.4 TLS tab — passthrough
- [ ] TLS passthrough toggle is present (TCP-specific, absent on HTTP IngressRoute)
- [ ] Enabling passthrough hides secret/options fields
- [ ] Can enable TLS without passthrough and select a secret

### 2.5 Full create flow
- [ ] Can create a minimal IngressRouteTCP (entry point, HostSNI match, service + port)
- [ ] New resource appears in list

### 2.6 Validation
- [ ] Match rule required
- [ ] Service name required
- [ ] Port always required (TCP)

---

## 3. Edit form

**Spec**: `ingressroutetcp-edit.spec.ts`

- [ ] Edit form pre-fills existing values
- [ ] Can modify match rule and save
- [ ] Can toggle TLS passthrough on/off and save
- [ ] Changes persist

---

## 4. Detail view

**Spec**: `ingressroutetcp-detail.spec.ts`

- [ ] Routes tab shows TCP match rules and services
- [ ] TLS tab shows passthrough banner when passthrough is enabled
- [ ] TLS tab shows certificate info when passthrough is disabled

---

## 5. Delete

- [ ] Delete from list action menu removes the resource
- [ ] Delete from detail masthead redirects to list
