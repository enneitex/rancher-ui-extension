# Policy Report Extension

Extension pour Rancher Dashboard affichant les informations de compliance basées sur les PolicyReports (wgpolicyk8s.io).

## Fonctionnalités

Cette extension ajoute automatiquement des indicateurs de compliance sur les ressources Kubernetes suivantes :

### Vue Liste
- **Colonne "Compliance"** : Affiche un résumé visuel des résultats de policy (badges colorés avec compteurs)
  - S'affiche uniquement dans les vues liste (pas dans les vues détail pour éviter la duplication)
- **Ressources supportées** :
  - Pods
  - Deployments
  - StatefulSets
  - DaemonSets
  - Jobs
  - CronJobs
  - IngressRoute (Traefik)

### Vue Détail

- **Onglet "Compliance"** : Table détaillée des résultats de policy pour la ressource
  - Groupe par severity ou status avec titres colorés
  - Détails extensibles (message, source, catégorie, rule)
  - Tri et recherche
  - Badges colorés pour severity et status
- **Ressources supportées** :
  - Toutes les ressources listées ci-dessus

## Architecture

### Composants principaux

#### Types ([types/](types/))
- `PolicyReport`, `ClusterPolicyReport` : Structures de données des CRDs wgpolicyk8s.io
- `PolicyReportResult` : Résultat individuel d'une policy
- `PolicyReportSummary` : Agrégation des compteurs (pass, fail, warn, error, skip)
- Enums `Result` et `Severity`

#### Store Vuex ([store/policy-report/](store/policy-report/))
- **State** :
  - `policyReports`: PolicyReports namespacés
  - `clusterPolicyReports`: ClusterPolicyReports cluster-wide
  - `reportMap`: Index par resourceId pour lookup rapide
  - `summaryMap`: Compteurs agrégés par resource
  - `loadingReports`: État de chargement

- **Getters** :
  - `reportByResourceId(resourceId)`: Récupère le rapport pour une ressource
  - `summaryByResourceId(resourceId)`: Récupère le résumé pour une ressource

- **Actions** :
  - `updatePolicyReports(reports)`: Met à jour les PolicyReports
  - `updateClusterPolicyReports(reports)`: Met à jour les ClusterPolicyReports
  - `regenerateSummaryMap()`: Régénère les compteurs agrégés

#### Module policyReporter ([modules/policyReporter.ts](modules/policyReporter.ts))
- `getReports()`: Fetch des rapports avec cache (TTL: 5min)
- `generateSummaryMap()`: Génération des compteurs agrégés
- `getFilteredReport()`: Filtre les rapports pour une ressource
- `colorForResult()`, `colorForSeverity()`: Helpers pour les couleurs

#### Composants UI

**[PolicyReportSummary.vue](formatters/PolicyReportSummary.vue)** (Formatter)
- Utilisé dans les colonnes des vues liste
- Affiche des badges colorés avec compteurs
- Dropdown au clic pour détails

**[ReporterPanel.vue](components/PolicyReporter/ReporterPanel.vue)** (Panel invisible)
- S'active automatiquement sur les vues liste
- Fetch les PolicyReports une seule fois par page
- Gère le loading state global

**[ResourceTab.vue](components/PolicyReporter/ResourceTab.vue)** (Onglet)
- Affiche un tableau détaillé des résultats avec `ResourceTable`
- Groupage par severity ou status (boutons de sélection)
- Titres de groupes colorés avec texte stylisé (label grisé + valeur en couleur)
- Sub-rows expandables pour détails (message, source, catégorie, rule)
- Badges colorés pour severity et status dans les colonnes
- Formatage intelligent des noms de policy (retire les préfixes clusterwide-/namespaced-)

### Intégration Rancher ([index.ts](index.ts))

#### Panels
```typescript
plugin.addPanel(PanelLocation.RESOURCE_LIST, ...)
```
Ajoute le ReporterPanel invisible sur :
- Vue Projects/Namespaces
- Vues liste de ressources (Pod, Deployment, etc.)

#### Colonnes
```typescript
plugin.addTableColumn(TableColumnLocation.RESOURCE, {
  resource: [...],
  mode: 'list'  // Afficher uniquement dans les vues liste
}, ...)
```
Ajoute la colonne "Compliance" avec le formatter `PolicyReportSummary`
- La colonne s'affiche **uniquement dans les vues liste** grâce à `mode: 'list'`
- Cela évite la duplication de colonne dans l'onglet "Compliance" des vues détail

#### Onglets
```typescript
plugin.addTab(TabLocation.RESOURCE_DETAIL, ...)
```
Ajoute l'onglet "Compliance" dans les vues détail
- Utilise `ResourceTable` pour le grouping et les fonctionnalités avancées
- Fake schema pour éviter l'injection de colonnes d'extension supplémentaires

## Prérequis

### CRDs wgpolicyk8s.io
L'extension nécessite les CRDs suivantes :
- `wgpolicyk8s.io.policyreport`
- `wgpolicyk8s.io.clusterpolicyreport`

Ces CRDs sont installées par :
- **Kyverno** (Policy Reporter)
- **Kubewarden** (avec auditScanner activé)
- Autres outils de policy supportant le standard wgpolicyk8s.io

### Configuration

Aucune configuration requise. L'extension détecte automatiquement la présence des CRDs et affiche les données si disponibles.

## Performance

### Optimisations
- **Cache** : TTL de 5 minutes sur les fetches de PolicyReports
- **Batching** : Traitement par chunks de 1000 rapports avec `requestIdleCallback`
- **Index maps** : `reportMap` et `summaryMap` pour lookups O(1)
- **Single fetch** : Le ReporterPanel fetch une seule fois par page

### Filtrage
- Seuls les rapports avec un `scope` valide sont indexés
- Les rapports sont filtrés par `resourceId` (namespace/name ou name)

## Développement

### Structure des fichiers
```
pkg/policy-report/
├── types/                         # Définitions TypeScript
│   ├── core.ts                   # Types de base (Result, Severity)
│   ├── wgpolicyk8s.io.ts         # Types des CRDs PolicyReport
│   └── policy-reporter.ts        # Types pour le module policyReporter
├── store/policy-report/           # Store Vuex
│   ├── index.ts                  # Configuration du store
│   ├── actions.ts                # Actions Vuex
│   ├── getters.ts                # Getters Vuex
│   └── mutations.ts              # Mutations Vuex
├── modules/                       # Logic métier
│   └── policyReporter.ts         # Fetch et traitement des PolicyReports
├── components/PolicyReporter/     # Composants UI
│   ├── ReporterPanel.vue         # Panel invisible pour fetch
│   └── ResourceTab.vue           # Onglet détail avec table
├── formatters/                    # Formatters de colonnes
│   └── PolicyReportSummary.vue   # Badge résumé pour colonnes
├── config/                        # Configuration
│   └── table-headers.ts          # Headers et options de grouping
├── l10n/                          # Internationalisation
│   └── en-us.yaml                # Traductions anglaises
├── index.ts                       # Point d'entrée de l'extension
├── package.json                   # Métadonnées du module
├── tsconfig.json                  # Configuration TypeScript
├── babel.config.js                # Configuration Babel
└── vue.config.js                  # Configuration Vue CLI
```

### Commandes

```bash
# Développement local (depuis la racine du projet)
API=rancher.dev.local yarn dev

# Build de l'extension
yarn build-pkg policy-report
```

### Tests
À implémenter avec Jest + Vue Test Utils (pattern de kubewarden-ui)

### Améliorations futures
- [ ] Tests unitaires et d'intégration
- [ ] Support de filtres avancés (par policy, par severity, par status)
- [ ] Export des résultats en CSV/JSON
- [ ] Indicateur de tendance (progression dans le temps)

## Références

- [Policy Reports CRDs](https://github.com/kubernetes-sigs/wg-policy-prototypes/tree/master/policy-report)
- [Kubewarden UI](https://github.com/rancher/kubewarden-ui) - Extension de référence
- [Rancher Extensions v3](https://extensions.rancher.io/extensions/next/home)
