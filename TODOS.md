# TODOS

## P3 — Tests unitaires fonctions pures

**What:** Ajouter des tests unitaires pour les fonctions pures dans `utils/victoria-metrics.js` : `loadVMConfigFromCluster` (parsing/validation des clés ConfigMap), `generateVMUrl` (construction URL), `dashboardExists` (logique ok/ko).

**Why:** Fonctions pures ou facilement mockables — ROI maximal. Couvre les cas limites : namespace invalide, port absent, ConfigMap vide.

**Context:** Le projet n'a pas de tests aujourd'hui. Note : `extractNsSvcFromProxyUrl` et `checkEndpointAvailability` ont été supprimées lors du refactoring — ne plus les cibler.

**Effort:** XS (human: ~1h / CC: ~5min)
