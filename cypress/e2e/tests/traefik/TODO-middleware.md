# TODO — Middleware e2e coverage

All tests tagged `@traefik @adminUser`.

> The extension supports 28+ middleware types. Testing every type is not feasible in e2e.
> Strategy: test one "simple value" type (stripPrefix) and one "auth" type (basicAuth) to
> cover the two structural variants. All other types are considered covered by unit tests.

## POs needed

| PO | File | Status |
|----|------|--------|
| `MiddlewareListPo` | `po/traefik/middleware-list.po.ts` | ⬜ |
| `MiddlewareFormPo` | `po/traefik/middleware-form.po.ts` | ⬜ |
| `MiddlewareDetailPo` | `po/traefik/middleware-detail.po.ts` | ⬜ |

---

## 1. Navigation & list view

**Spec**: `middleware-navigation.spec.ts`

- [ ] List page reachable at `/c/local/explorer/traefik.io.middleware`
- [ ] Masthead Create button present
- [ ] Middleware item visible in Traefik side-nav
- [ ] Resource created via API appears in list
- [ ] Types column shows the middleware type name (e.g. "stripPrefix")

---

## 2. Create form — stripPrefix type

**Spec**: `middleware-create.spec.ts`

- [ ] Create form opens and shows a middleware type selector
- [ ] Can select the "stripPrefix" middleware type
- [ ] stripPrefix form shows prefix list input
- [ ] Can add a prefix value
- [ ] Can remove a prefix value
- [ ] Can save and resource appears in list with "stripPrefix" in Types column

---

## 3. Create form — basicAuth type

- [ ] Can select "basicAuth" middleware type
- [ ] basicAuth form shows secret selector
- [ ] Can type a secret reference
- [ ] Can save

---

## 4. Detail view

**Spec**: `middleware-detail.spec.ts`

- [ ] Configuration tab shows a card per middleware type
- [ ] Card title matches the middleware type label (i18n key)
- [ ] YAML editor in card shows the type's configuration
- [ ] Navigating to a middleware with multiple types shows multiple cards

---

## 5. Edit form

**Spec**: `middleware-edit.spec.ts`

- [ ] Edit form pre-fills existing middleware type configuration
- [ ] Can modify values and save
- [ ] Changes reflected in detail view

---

## 6. Delete

- [ ] Delete from list removes the resource
- [ ] Middleware references in IngressRoute routes become stale (no blocking — just display)
