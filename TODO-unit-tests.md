# TODO — Unit Test Gaps

> Audit réalisé le 2026-05-11. Inspiré du workflow `daily-test-improver` de rancher/dashboard.
> Référence de conventions : `docs/agents.md/contributors/2_unit-tests.md` dans rancher/dashboard.
> Infrastructure Jest déjà en place (`yarn test:ci`, `jest.config.js`).

---

## État actuel — pkg/traefik (✅ complet)

Toutes les lacunes initiales ont été comblées. 220 tests passent sur 7 suites.

| Fichier source | Fichier de test | État |
|---|---|---|
| `models/traefik.io.ingressroute.js` | `models/__tests__/traefik.io.ingressroute.test.ts` | ✅ |
| `models/traefik.io.ingressroutetcp.js` | `models/__tests__/traefik.io.ingressroutetcp.test.ts` | ✅ créé |
| `models/traefik.io.middleware.js` | `models/__tests__/traefik.io.middleware.test.ts` | ✅ |
| `models/traefik.io.tlsoption.js` | `models/__tests__/traefik.io.tlsoption.test.ts` | ✅ créé |
| `edit/traefik.io.ingressroute/index.vue` | `edit/traefik.io.ingressroute/__tests__/validation.test.ts` | ✅ |
| `edit/traefik.io.ingressroutetcp/index.vue` | `edit/traefik.io.ingressroutetcp/__tests__/validation.test.ts` | ✅ |
| `edit/traefik.io.tlsoption/index.vue` | `edit/traefik.io.tlsoption/__tests__/validation.test.ts` | ✅ |
| `formatters/RoutesList.vue` | `formatters/__tests__/RoutesList.test.ts` | ⛔ exclu (ts-jest absent) |

### Conformité au guide `2_unit-tests.md`

| Règle | Avant | Après |
|---|---|---|
| Extension `.test.ts` | ❌ 5 fichiers en `.js` | ✅ tous renommés en `.ts` |
| `toStrictEqual` (pas `toEqual`) | ❌ 10 occurrences | ✅ corrigées |
| `it.each` pour cas répétitifs | ⚠️ partiel | ✅ `requiresClientCerts`, `entryPointsValid`, `validationPassed` convertis |
| `toBe` pour primitives | ✅ acceptable | ✅ conservé |

---

## Edge cases non couverts — pkg/traefik (✅ complet — session 2026-05-11)

Tous les edge cases listés ci-dessous ont été implémentés. 258 tests passent sur 7 suites.

### ✅ Haute valeur — implémenté

#### `traefik.io.ingressroute.test.ts` — `createServiceForListPage` + `createRulesForListPage`

- [x] `createRulesForListPage` — tableau vide si `spec.routes` vide
- [x] `createRulesForListPage` — flatMap correct sur routes × services multiples
- [x] `createRulesForListPage` — route sans services → contribue 0 élément
- [x] `createServiceForListPage` — `display = "name:port"` quand les deux sont présents
- [x] `createServiceForListPage` — `display = "name"` quand port absent
- [x] `createServiceForListPage` — `display = "-"` quand serviceName absent
- [x] `createServiceForListPage` — `serviceNamespace` fallback vers `this.namespace`
- [x] `createServiceForListPage` — `serviceKind` default `'Service'`

#### `validation.test.ts` — fallback chain `label → value → ''`

- [x] (ingressroute) `service.name` : `{ label: '', value: 'fallback' }` → `'fallback'`
- [x] (ingressroute) `service.name` : `{ label: '', value: '' }` → `''`
- [x] (ingressroute) `service.port` : même logique label → value
- [x] (ingressroute) `entryPoints` : objet avec `value` mais sans `label` → utilise `value`
- [x] (ingressroutetcp) `service.name` coercion : label et fallback value

### ✅ Valeur moyenne — implémenté

- [x] `ingressClass` avec `spec.ingressClassName` (HTTP, comme TCP)
- [x] `relationships` getter lazy : metadata absent, régénération, pas de régénération si peuplé
- [x] `getMiddlewareConfig` — 3 cas (présent, absent, spec null)
- [x] `hasMiddlewareType` — 2 cas
- [x] `createSecretLink` — route location, null si vide, fallback namespace
- [x] `basicAuthSecretLink`, `digestAuthSecretLink`, `rateLimitRedisSecretLink`
- [x] `routesValid` avec `match: null` (ingressroute + ingressroutetcp)
- [x] `curvePreferences` préservé quand non-vide (tlsoption)

### 🟢 Faible valeur — skip justifié

- `routes`, `entryPoints`, `tlsConfig` getters sur IngressRoute : wrappers `get(this.spec, 'x') || []`
- `refreshRelationships()` : wrapper d'une ligne, `_generateRelationships` déjà bien testé

---

## État actuel — pkg/cnpg (✅ complet — session 2026-05-11)

| Fichier source | Fichier de test | État |
|---|---|---|
| `models/postgresql.cnpg.io.cluster.js` | `models/__tests__/postgresql.cnpg.io.cluster.test.ts` | ✅ 45 tests (renommé .js → .ts) |

Couverture : tous les états du PHASE_MAP (active, provisioning×4, updating×1, degraded×10, suspended×4), chaîne de priorité annotation > hibernation > phase > no-status, phaseReason comme message, flag error=false.

---

## Lacunes restantes — autres extensions

### pkg/compliance

#### 1. `store/open-report/getters.ts`
**Fichier test à créer :** `store/open-report/__tests__/getters.test.ts`

- [ ] `summaryByResourceId` — retourne `{pass:0, fail:0, warn:0, error:0, skip:0}` quand l'id est absent
- [ ] `reportByResourceId` — retourne le bon objet depuis `reportMap`
- [ ] `loadingReports`, `reports`, `clusterReports` — getters directs

#### 2. `store/open-report/actions.ts`
**Fichier test à créer :** `store/open-report/__tests__/actions.test.ts`

- [ ] `regenerateSummaryMap` — appelle `generateSummaryMap(state)` et commit `setSummaryMap`
- [ ] `updateReports` / `updateClusterReports` — délèguent avec la bonne `reportArrayKey`

#### 3. `modules/openReports.ts` — fonctions non couvertes
**Fichier test existant :** `modules/__tests__/openReports.test.ts` (à compléter)

- [ ] `colorForResult` — tous les cas (`fail`, `error`, `pass`, `warn`, `skip`, inconnu)
- [ ] `colorForSeverity` — tous les cas (`info`, `low`, `medium`, `high`, `critical`, inconnu)
- [ ] `severitySortValue` — tous les rangs
- [ ] `getReports` — logique de cache TTL (appel double dans TTL → promise réutilisée)
- [ ] `processReportsInBatches` — traitement en chunks de 1000

---

## Hors scope / exclusions

- **Composants Vue** (`*.vue`) — `@vue/vue3-jest` sans `ts-jest` exclut les SFC
- `pkg/traefik/formatters/RoutesList.test.ts` — explicitement ignoré dans `jest.config.js`
- Fonctions pass-through triviales (getters 1-ligne, wrappers simples)

---

## Commandes

```bash
# Lancer tous les tests unitaires
yarn test:ci

# Lancer uniquement le pkg traefik
./node_modules/.bin/jest --testPathPattern=pkg/traefik --no-coverage

# Lancer un fichier précis
./node_modules/.bin/jest pkg/traefik/models/__tests__/traefik.io.tlsoption.test.ts
```
