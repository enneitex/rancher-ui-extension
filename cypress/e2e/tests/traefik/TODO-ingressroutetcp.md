# TODO — IngressRouteTCP e2e coverage

All tests tagged `@traefik @adminUser`. Resources created via API unless the test
specifically exercises the UI form.

## POs needed

| PO | File | Status |
|----|------|--------|
| `IngressRouteTCPListPo` | `po/traefik/ingressroutetcp-list.po.ts` | ✅ done |
| `IngressRouteTCPFormPo` | `po/traefik/ingressroutetcp-form.po.ts` | ✅ done |
| `IngressRouteTCPDetailPo` | `po/traefik/ingressroutetcp-detail.po.ts` | ✅ done |

> Reuse `IngressRouteFormPo` base class where possible — the form structure is the same,
> only entry point input and TLS passthrough differ.

---

## 1. Navigation & list view

**Spec**: `ingressroutetcp-navigation.spec.ts`

- [x] List page reachable at `/c/local/explorer/traefik.io.ingressroutetcp`
- [x] Masthead Create button present
- [x] IngressRouteTCP item visible in Traefik side-nav group
- [x] Resource created via API appears in list
- [x] Entry-point column shows correct value

---

## 2. Create form

**Spec**: `ingressroutetcp-create.spec.ts`

### 2.1 Entry Points tab — free-form input
- [x] Entry points are typed as tags (not a predefined dropdown)
- [x] Can type a custom entry point name and confirm with Enter
- [x] Can add multiple entry points
- [x] Can remove an entry point tag

### 2.2 Routes tab
- [x] Default match is `HostSNI(\`*\`)` (TCP default)
- [x] Can modify the match rule
- [x] Port field is always required for TCP services (unlike HTTP)
- [ ] Validation: missing port → error (TCP services always require port)
- [x] Can add multiple services to a route

### 2.3 Middlewares (TCP)
- [ ] Middleware dropdown shows only `MiddlewareTCP` resources (not HTTP middlewares)

### 2.4 TLS tab — passthrough
- [x] TLS passthrough toggle is present (TCP-specific, absent on HTTP IngressRoute)
- [x] Enabling passthrough hides secret/options fields
- [x] Can enable TLS without passthrough and select a secret

### 2.5 Full create flow
- [x] Can create a minimal IngressRouteTCP (entry point, HostSNI match, service + port)
- [x] New resource appears in list

### 2.6 Validation
- [ ] Match rule required
- [ ] Service name required
- [x] Port always required (TCP)

---

## 3. Edit form

**Spec**: `ingressroutetcp-edit.spec.ts`

- [x] Edit form pre-fills existing values
- [x] Can modify match rule and save
- [x] Can toggle TLS passthrough on/off and save
- [x] Changes persist

---

## 4. Detail view

**Spec**: `ingressroutetcp-detail.spec.ts`

- [x] Routes tab shows TCP match rules and services
- [x] TLS tab shows passthrough banner when passthrough is enabled
- [x] TLS tab shows certificate info when passthrough is disabled

---

## 5. Delete

- [x] Delete from list action menu removes the resource
- [x] Delete from detail masthead redirects to list
