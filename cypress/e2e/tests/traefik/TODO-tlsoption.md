# TODO — TLSOption e2e coverage

All tests tagged `@traefik @adminUser`.

## POs needed

| PO | File | Status |
|----|------|--------|
| `TLSOptionListPo` | `po/traefik/tlsoption-list.po.ts` | ⬜ |
| `TLSOptionFormPo` | `po/traefik/tlsoption-form.po.ts` | ⬜ |
| `TLSOptionDetailPo` | `po/traefik/tlsoption-detail.po.ts` | ⬜ |

---

## 1. Navigation & list view

**Spec**: `tlsoption-navigation.spec.ts`

- [ ] List page reachable at `/c/local/explorer/traefik.io.tlsoption`
- [ ] Masthead Create button present
- [ ] TLSOption item visible in Traefik side-nav
- [ ] Resource created via API appears in list
- [ ] MinVersion and MaxVersion columns show values (or "—" when unset)
- [ ] CipherSuites column shows first suite + "+N more" badge when multiple

---

## 2. Create form

**Spec**: `tlsoption-create.spec.ts`

### 2.1 TLS Versions tab
- [ ] Form opens with TLS Versions tab active
- [ ] Can select minVersion (VersionTLS12)
- [ ] Can select maxVersion (VersionTLS13)
- [ ] Saving with only versions creates a valid TLSOption

### 2.2 Cipher Suites tab
- [ ] Can add a cipher suite string
- [ ] Can add multiple cipher suites
- [ ] Can remove a cipher suite
- [ ] `preferServerCipherSuites` checkbox is present and toggleable

### 2.3 Client Authentication tab
- [ ] Can select a client auth type (e.g. RequireAndVerifyClientCert)
- [ ] Selecting an auth type that requires secrets shows the secrets input
- [ ] Can type a secret name reference

### 2.4 Advanced tab
- [ ] `sniStrict` checkbox is present and toggleable
- [ ] `disableSessionTickets` checkbox is present and toggleable
- [ ] ALPN protocols list: can add "http/1.1", "h2"
- [ ] Curve preferences list: can add "CurveP256"

### 2.5 Full create flow
- [ ] Can create a TLSOption with minVersion + maxVersion and save
- [ ] New resource appears in list with correct column values

---

## 3. Edit form

**Spec**: `tlsoption-edit.spec.ts`

- [ ] Edit form pre-fills existing TLS version values
- [ ] Can change minVersion and save
- [ ] Can add a cipher suite to existing TLSOption and save
- [ ] Changes reflected in list column

---

## 4. Detail view

**Spec**: `tlsoption-detail.spec.ts`

- [ ] TLS Versions card shows minVersion and maxVersion (or absent when unset)
- [ ] Cipher Suites card lists all configured suites
- [ ] Client Authentication card shows auth type and secret links
- [ ] Advanced Options card shows sniStrict and disableSessionTickets state
- [ ] Cards are absent when their section is not configured

---

## 5. Delete

- [ ] Delete from list removes the resource
- [ ] TLSOption reference in IngressRoute TLS config becomes stale (display only)
