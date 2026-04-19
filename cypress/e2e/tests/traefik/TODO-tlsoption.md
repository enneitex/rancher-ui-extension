# TODO — TLSOption e2e coverage

All tests tagged `@traefik @adminUser`.

## POs needed

| PO | File | Status |
|----|------|--------|
| `TLSOptionListPo` | `po/traefik/tlsoption-list.po.ts` | ✅ done |
| `TLSOptionFormPo` | `po/traefik/tlsoption-form.po.ts` | ✅ done |
| `TLSOptionDetailPo` | `po/traefik/tlsoption-detail.po.ts` | ✅ done |

---

## 1. Navigation & list view

**Spec**: `tlsoption-navigation.spec.ts`

- [x] List page reachable at `/c/local/explorer/traefik.io.tlsoption`
- [x] Masthead Create button present
- [x] TLSOption item visible in Traefik side-nav
- [x] Resource created via API appears in list
- [x] MinVersion and MaxVersion columns show values (or "—" when unset)
- [ ] CipherSuites column shows first suite + "+N more" badge when multiple

---

## 2. Create form

**Spec**: `tlsoption-create.spec.ts`

### 2.1 TLS Versions tab
- [x] Form opens with TLS Versions tab active
- [x] Can select minVersion (VersionTLS12)
- [x] Can select maxVersion (VersionTLS13)
- [x] Saving with only versions creates a valid TLSOption

### 2.2 Cipher Suites tab
- [x] Can add a cipher suite string
- [x] Can add multiple cipher suites
- [ ] Can remove a cipher suite
- [x] `preferServerCipherSuites` checkbox is present and toggleable

### 2.3 Client Authentication tab
- [x] Can select a client auth type (e.g. RequireAndVerifyClientCert)
- [ ] Selecting an auth type that requires secrets shows the secrets input
- [ ] Can type a secret name reference

### 2.4 Advanced tab
- [x] `sniStrict` checkbox is present and toggleable
- [x] `disableSessionTickets` checkbox is present and toggleable
- [x] ALPN protocols list: can add "http/1.1", "h2"
- [x] Curve preferences list: can add "CurveP256"

### 2.5 Full create flow
- [x] Can create a TLSOption with minVersion + maxVersion and save
- [x] New resource appears in list with correct column values

---

## 3. Edit form

**Spec**: `tlsoption-edit.spec.ts`

- [x] Edit form pre-fills existing TLS version values
- [x] Can change minVersion and save
- [x] Can add a cipher suite to existing TLSOption and save
- [x] Changes reflected in list column

---

## 4. Detail view

**Spec**: `tlsoption-detail.spec.ts`

- [x] TLS Versions card shows minVersion and maxVersion (or absent when unset)
- [x] Cipher Suites card lists all configured suites
- [x] Client Authentication card shows auth type and secret links
- [x] Advanced Options card shows sniStrict and disableSessionTickets state
- [x] Cards are absent when their section is not configured

---

## 5. Delete

- [x] Delete from list removes the resource
- [ ] TLSOption reference in IngressRoute TLS config becomes stale (display only)
