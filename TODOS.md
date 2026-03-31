# TODOS

## P3 — Tests unitaires fonctions pures ✓ COVERED IN feat/improve-testing

**What:** Ajouter des tests unitaires pour les fonctions pures dans `utils/victoria-metrics.js` : `loadVMConfigFromCluster`, `generateVMUrl`, `dashboardExists`.

**Status:** Inclus dans le plan de test de feat/improve-testing.

---

## P2 — Fix: removeReportById ne nettoie pas reportMap ✓ FIXED IN feat/improve-testing

**What:** `pkg/compliance/store/open-report/mutations.ts` — fixed: `removeReportById` now derives the scope key and deletes from `reportMap` after splicing from the array.

---

## P3 — Fix: dnsLabel regex accepte les majuscules ✓ FIXED IN feat/improve-testing

**What:** `pkg/monitoring/utils/victoria-metrics.js` — fixed: removed `/i` flag from `dnsLabel` regex. Also fixed `portNum` to enforce range 1-65535.

---

## P3 — Fix: removeReportById ne cherche pas dans clusterReports

**What:** `pkg/compliance/store/open-report/mutations.ts` — `removeReportById` only searches `state.reports`. If a ClusterReport needs to be removed by id, it won't be found.

**Why:** Discovered during /review adversarial pass on feat/improve-testing.

**Fix:** Extend search to both `state.reports` and `state.clusterReports`, or document that this mutation is intentionally reports-only.

**Effort:** XS (human: ~20min / CC: ~3min)

---

## P4 — Tests: processReportsInBatches async

**What:** Ajouter des tests pour `processReportsInBatches` dans `pkg/compliance/modules/openReports.ts`. La logique de chunking (`CHUNK_SIZE=1000`) et le fallback `requestIdleCallback → setTimeout` ne sont pas couverts.

**Why:** Différé de feat/improve-testing (mocking de `requestIdleCallback` est complexe).

**Effort:** S (human: ~2h / CC: ~15min)

---

## P4 — Tests: Vue formatter components

**What:** Ajouter des tests de rendu pour `pkg/traefik/formatters/IngressHosts.vue`, `MiddlewareTypes.vue`, etc.

**Why:** Différé car nécessite le même mocking store que les pages edit/list/detail.

**Context:** Une fois l'infra Jest stabilisée (feat/improve-testing), l'ajout de ces tests est XS par composant.

**Effort:** XS par composant (human: ~30min/composant / CC: ~3min/composant)
