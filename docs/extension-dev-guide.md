# Guide Technique — Développement d'Extensions Rancher Dashboard

> **Référence principale** : `rancher-dashboard/docusaurus/extensions_versioned_docs/version-v2/`
> **Stack** : Vue 3 + TypeScript — Rancher ≥ 2.13.0 — `@rancher/shell` ^3.0.10

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure d'une extension](#2-structure-dune-extension)
3. [Enregistrement du plugin — `index.ts`](#3-enregistrement-du-plugin--indexts)
4. [Configuration du produit — `product.js`](#4-configuration-du-produit--productjs)
5. [Navigation & Routing](#5-navigation--routing)
6. [Points d'extension UI](#6-points-dextension-ui)
7. [LocationConfig — ciblage précis](#7-locationconfig--ciblage-précis)
8. [Composants auto-découverts](#8-composants-auto-découverts)
9. [Modèles de données — SteveModel](#9-modèles-de-données--stevemodel)
10. [State Management — Vuex](#10-state-management--vuex)
11. [Internationalisation](#11-internationalisation)
12. [Proxy API](#12-proxy-api)
13. [Compatibilité & annotations Helm](#13-compatibilité--annotations-helm)
14. [Workflow de développement](#14-workflow-de-développement)
15. [Composants Rancher réutilisables](#15-composants-rancher-réutilisables)

---

## 1. Vue d'ensemble

Une extension Rancher est une **librairie Vue compilée** chargée au runtime par le Dashboard, packagée en Helm chart pour distribution. Elle peut :

- Ajouter de nouveaux **produits** (sections entières dans le menu)
- Injecter des **onglets, panneaux, colonnes, actions** dans des pages existantes
- Enregistrer des **composants** pour des types de ressources Kubernetes (CRDs)
- Gérer son propre **état** (Vuex) et ses **routes** Vue Router

> **Doc source** : `introduction.md`, `home.md`

---

## 2. Structure d'une extension

```
pkg/<extension-name>/
├── index.ts                  # Point d'entrée — obligatoire
├── product.js                # DSL de configuration produit
├── package.json              # Métadonnées + annotations Helm
├── tsconfig.json             # Config TypeScript locale
├── vue.config.js             # Config Vue CLI (délègue à @rancher/shell)
├── babel.config.js           # Config Babel
│
├── components/               # Composants réutilisables (non auto-découverts)
├── edit/                     # Formulaires édition (auto-découverts)
│   └── <crd.type>/
│       └── index.vue
├── list/                     # Vues de liste (auto-découverts)
│   └── <crd.type>.vue
├── detail/                   # Vues de détail (auto-découverts)
│   └── <crd.type>.vue
├── models/                   # Classes de données — héritent SteveModel
│   └── <crd.type>.js
├── formatters/               # Composants pour colonnes de table
├── store/                    # Modules Vuex
├── routing/                  # Routes Vue Router personnalisées
├── pages/                    # Pages complètes
├── types/                    # Types TypeScript
├── assets/                   # Icônes, images
└── l10n/
    └── en-us.yaml            # Traductions
```

> **Doc source** : `extensions-configuration.md`, `extensions-getting-started.md`

---

## 3. Enregistrement du plugin — `index.ts`

C'est le point d'entrée obligatoire. Il reçoit un objet `IPlugin` et orchestre l'initialisation.

```typescript
// pkg/traefik/index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';

export default function(plugin: IPlugin) {
  // 1. Auto-découverte des composants (list/, edit/, detail/, models/)
  importTypes(plugin);

  // 2. Métadonnées depuis package.json
  plugin.metadata = require('./package.json');

  // 3. Configuration produit (menu, types, colonnes)
  plugin.addProduct(require('./product'));

  // 4. Routes Vue Router supplémentaires (optionnel)
  plugin.addRoutes(routes);

  // 5. Store Vuex (optionnel)
  plugin.addDashboardStore(store.config.namespace, store.specifics, store.config);

  // 6. Pagination serveur (Rancher ≥ 2.12, optionnel)
  plugin.enableServerSidePagination?.({
    cluster: {
      resources: {
        enableSome: {
          enabled: ['traefik.io.ingressroute', 'traefik.io.middleware'],
        }
      }
    }
  });

  // 7. Injection dans ressources existantes (tabs, panels, columns)
  plugin.addTab(TabLocation.RESOURCE_DETAIL, { resource: [POD] }, { ... });
  plugin.addPanel(PanelLocation.RESOURCE_LIST, { resource: [POD] }, { ... });
  plugin.addTableColumn(TableColumnLocation.RESOURCE, { resource: [POD] }, { ... });
}
```

> **Doc source** : `api/metadata.md`, `api/components/auto-import.md`

---

## 4. Configuration du produit — `product.js`

Le fichier `product.js` utilise le DSL Rancher pour configurer l'apparence et le comportement des ressources.

```javascript
// pkg/traefik/product.js
import { STEVE_AGE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, STEVE_STATE_COL }
  from '@rancher/shell/config/pagination-table-headers';
import { STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE }
  from '@shell/config/table-headers';

export const EXPLORER = 'explorer'; // inStore : 'cluster' ou 'management'

export function init(plugin, store) {
  const { basicType, mapGroup, weightGroup, configureType, headers } =
    plugin.DSL(store, EXPLORER);

  // Groupe dans le menu latéral
  mapGroup('traefik.io', 'Traefik');           // API group → label affiché
  weightGroup('Traefik', 96, true);            // Poids (plus élevé = plus haut)

  // Configuration d'un type de ressource
  configureType('traefik.io.ingressroute', {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    showAge:     true,
    showState:   true,
    canYaml:     true,
  });

  // Colonnes : signature headers(resourceType, clientSideCols, serverSideCols)
  headers('traefik.io.ingressroute',
    // Colonnes sans pagination serveur (client-side, getValue possible)
    [
      STATE, NAME_COL, NAMESPACE_COL,
      {
        name:     'routes',
        labelKey: 'traefik.headers.routes',  // Clé i18n
        getValue: row => row.targetRoutes,   // Calculé depuis le modèle
        sort:     false,
      },
      {
        name:      'entryPoints',
        labelKey:  'traefik.headers.entryPoints',
        value:     'spec.entryPoints',       // Chemin JSON
        sort:      'spec.entryPoints',
        formatter: 'List',                   // Composant formatter
      },
      AGE,
    ],
    // Colonnes avec pagination serveur (server-side, uniquement champs indexés)
    [
      STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL,
      {
        name:     'entryPoints',
        labelKey: 'traefik.headers.entryPoints',
        value:    'spec.entryPoints',
        sort:     false,  // Seuls les additionalPrinterColumns sont indexés
        search:   false,
      },
      STEVE_AGE_COL,
    ]
  );

  // Ajouter au menu latéral
  basicType(['traefik.io.ingressroute', 'traefik.io.middleware'], 'traefik.io');
}
```

### DSL disponible

| Fonction | Usage |
|----------|-------|
| `configureType(type, opts)` | Rend créable/éditable/supprimable, active YAML |
| `headers(type, clientCols, serverCols?)` | Définit les colonnes de liste |
| `basicType([types], group?)` | Ajoute les types au menu latéral |
| `mapGroup(apiGroup, label)` | Mappe un API group vers un label affiché |
| `weightGroup(label, weight, global?)` | Trie les groupes dans le menu |
| `weightType(type, weight, global?)` | Trie les types individuellement |
| `virtualType({name, label, route})` | Crée une page virtuelle (sans CRD) |

> **Doc source** : `api/nav/products.md`, `api/nav/side-menu.md`, `api/nav/resource-page.md`, `api/nav/custom-page.md`

---

## 5. Navigation & Routing

### Type de produit : cluster-level vs top-level

| | **Cluster-level** (`inStore: 'cluster'`) | **Top-level** (`inStore: 'management'`) |
|---|---|---|
| URL pattern | `/c/:cluster/<product>/...` | `/<product>/c/:cluster/...` |
| Contexte cluster | Fourni automatiquement | Nécessite `BLANK_CLUSTER = '_'` |
| Usage | Ressources namespaced d'un cluster | Multi-cluster, gestion globale |

Notre projet utilise `EXPLORER = 'explorer'` (cluster-level, store `cluster`).

### Structure de routes (cluster-level)

```typescript
// pkg/monitoring/routing/routes.ts
const routes = [
  {
    name:      'c-cluster-monitoring-overview',
    path:      '/c/:cluster/monitoring',
    component: () => import('../pages/MonitoringOverview.vue'),
    meta:      { product: 'monitoring' },  // Obligatoire
  },
  {
    name:      'c-cluster-monitoring-resource-list',
    path:      '/c/:cluster/monitoring/:resource',
    component: () => import('../pages/ResourceList.vue'),
    meta:      { product: 'monitoring' },
  },
];
```

> **Doc source** : `api/nav/routing.md`, `api/concepts.md`, `usecases/cluster-level-product.md`

---

## 6. Points d'extension UI

Ces APIs permettent d'injecter des éléments dans des pages existantes de Rancher.

### `addTab` — Onglets sur pages de détail

```typescript
import { TabLocation } from '@shell/core/types';
import { POD, NODE, WORKLOAD_TYPES } from '@shell/config/types';

plugin.addTab(
  TabLocation.RESOURCE_DETAIL,
  { resource: [POD, WORKLOAD_TYPES.DEPLOYMENT] },  // LocationConfig
  {
    name:       'my-tab',
    labelKey:   'myExtension.tab.label',  // Clé i18n
    weight:     -4,       // Négatif = affiché après les onglets natifs
    showHeader: false,    // Masque le titre dans l'onglet
    component:  () => import('./components/MyTab.vue'),  // Lazy-load
  }
);
```

### `addPanel` — Panneaux injectés dans les vues

```typescript
import { PanelLocation } from '@shell/core/types';

plugin.addPanel(
  PanelLocation.RESOURCE_LIST,
  { resource: [POD, WORKLOAD_TYPES.DEPLOYMENT, WORKLOAD_TYPES.DAEMON_SET] },
  { component: () => import('./components/MyPanel.vue') }
);
```

Locations disponibles :
- `PanelLocation.DETAILS_MASTHEAD` — En-tête de la page détail
- `PanelLocation.DETAIL_TOP` — Haut de la page détail
- `PanelLocation.RESOURCE_LIST` — Au-dessus de la liste de ressources

### `addTableColumn` — Colonnes supplémentaires dans les listes

```typescript
import { TableColumnLocation } from '@shell/core/types';

plugin.addTableColumn(
  TableColumnLocation.RESOURCE,
  {
    resource: [POD, WORKLOAD_TYPES.DEPLOYMENT],
    mode:     ['list'],  // Uniquement dans les vues liste
  },
  {
    name:      'my-column',
    labelKey:  'myExtension.column.label',
    tooltip:   'myExtension.column.tooltip',  // Clé i18n pour tooltip
    getValue:  (row: any) => row,             // Passe la ressource au formatter
    formatter: 'MyFormatter',                 // Composant dans formatters/
  }
);
```

### `addAction` — Boutons et actions

```typescript
import { ActionLocation } from '@shell/core/types';

// Action dans la barre d'en-tête
plugin.addAction(ActionLocation.HEADER, { resource: ['pod'] }, {
  tooltipKey: 'myExtension.action.tooltip',
  icon:       'icon-plus',
  shortcut:   'p',
  enabled:    (ctx) => true,
  invoke:     (ctx) => { /* handler */ },
});

// Action dans les menus de table (kebab menu)
plugin.addAction(ActionLocation.TABLE, { resource: ['pod'] }, {
  labelKey: 'myExtension.action.label',
  icon:     'icon-delete',
  multiple: true,  // Disponible en sélection multiple
  enabled:  (ctx) => ctx.currentRouter().params.product === 'explorer',
  invoke:   (ctx, resources) => { /* handler */ },
});
```

### `addCard` — Cartes sur le dashboard cluster

```typescript
import { CardLocation } from '@shell/core/types';

plugin.addCard(
  CardLocation.CLUSTER_DASHBOARD_CARD,
  { cluster: ['local'] },
  {
    labelKey:  'myExtension.card.label',
    component: () => import('./components/MyCard.vue'),
  }
);
```

> **Doc source** : `api/tabs.md`, `api/panels.md`, `api/table-columns.md`, `api/actions.md`, `api/cards.md`

---

## 7. LocationConfig — ciblage précis

`LocationConfig` est l'objet `when` passé à tous les points d'extension. Il contrôle **où** l'injection s'applique.

```typescript
{
  product:    ['explorer', 'fleet'],     // ID du produit actif
  resource:   ['pod', 'deployment', '*'], // Type de ressource ('*' = tous)
  cluster:    ['local'],                 // ID du cluster
  namespace:  ['default'],              // Namespace
  mode:       ['list', 'detail', 'edit', 'create'], // Mode de la vue
  id:         ['specific-resource-id'], // ID de ressource spécifique
  context:    { provider: 'aws' },      // Propriétés du contexte
  queryParam: { type: 'custom' },       // Query params de l'URL
  hash:       ['node-pools'],           // Hash de l'URL
  path:       [{ urlPath: '/', exact: true }], // Chemin URL
}
```

**Règles** :
- `{}` vide ou omis = s'applique partout
- Les tableaux sont des conditions OR (l'une ou l'autre suffit)
- Plusieurs propriétés = conditions AND

> **Doc source** : `api/common.md`

---

## 8. Composants auto-découverts

`importTypes(plugin)` scanne les dossiers conventionnels et enregistre automatiquement les composants :

| Dossier | Type enregistré | Usage |
|---------|----------------|-------|
| `list/<crd.type>.vue` | `list` | Vue liste de la ressource |
| `edit/<crd.type>/index.vue` | `edit` | Formulaire création/édition |
| `detail/<crd.type>.vue` | `detail` | Vue détail de la ressource |
| `models/<crd.type>.js` | `model` | Classe de données (hérite SteveModel) |
| `formatters/<Name>.vue` | `formatter` | Composant pour colonnes de table |

**Convention de nommage** : Le nom de fichier (sans `.vue`) devient l'ID du composant.
Pour un CRD `traefik.io/ingressroute`, le nom normalisé est `traefik.io.ingressroute`.

```
edit/traefik.io.ingressroute/index.vue  →  type: 'edit',  id: 'traefik.io.ingressroute'
list/traefik.io.ingressroute.vue        →  type: 'list',  id: 'traefik.io.ingressroute'
models/traefik.io.ingressroute.js       →  type: 'model', id: 'traefik.io.ingressroute'
```

> **Doc source** : `api/components/auto-import.md`, `api/components/resources.md`

---

## 9. Modèles de données — SteveModel

Les modèles étendent `SteveModel` pour enrichir les ressources Kubernetes avec des getters, des liens et des relationships.

```javascript
// pkg/traefik/models/traefik.io.ingressroute.js
import SteveModel from '@shell/plugins/steve/steve-class';
import { get } from '@shell/utils/object';

export default class IngressRoute extends SteveModel {
  // Getter calculé depuis les métadonnées
  get ingressClass() {
    return this.metadata?.annotations?.['kubernetes.io/ingress.class'] || '';
  }

  // 'details' est affiché dans le masthead de la page de détail
  get details() {
    return [
      { label: 'EntryPoints', content: (this.spec?.entryPoints || []).join(', ') },
      { label: 'Ingress Class', content: this.ingressClass },
    ].filter(d => d.content);
  }

  // Relationships pour afficher les ressources liées
  get relationships() {
    if (!this.metadata?.relationships?.length) {
      this.metadata.relationships = this._generateRelationships();
    }
    return this.metadata.relationships;
  }

  _generateRelationships() {
    const relationships = [];
    const namespace = this.metadata?.namespace;

    // Liens vers les Services référencés
    (this.spec?.routes || []).forEach(route => {
      (route.services || []).forEach(service => {
        relationships.push({
          toType:   'service',
          toId:     `${namespace}/${service.name}`,
          rel:      'uses',
          fromType: 'traefik.io.ingressroute',
          fromId:   `${namespace}/${this.metadata.name}`,
          state:    'active',
        });
      });
    });

    return relationships;
  }

  // Liens de navigation vers d'autres ressources
  targetTo(workloads, serviceName) {
    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: { resource: 'service', product: 'explorer', id: serviceName, namespace: this.namespace },
    };
  }
}
```

**Getters spéciaux reconnus par Rancher** :
- `details` → Affiché dans le masthead de la page de détail
- `relationships` → Liens vers ressources liées (onglet "Related Resources")
- `tableLinks` → Liens dans les colonnes de liste

> **Doc source** : `api/components/resources.md`

---

## 10. State Management — Vuex

Pour les données qui dépassent le scope d'un composant, utiliser un store Vuex dédié.

```typescript
// pkg/compliance/store/open-report/index.ts
import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

// 1. Factory de state (pattern recommandé pour l'isolation)
const reportStoreFactory = (config): CoreStoreSpecifics => ({
  state: () => ({ ...config }),
  getters:   { ...getters },
  mutations: { ...mutations },
  actions:   { ...actions },
});

// 2. Config du namespace
const config: CoreStoreConfig = { namespace: 'openReport' };

export default {
  specifics: reportStoreFactory({ loadingReports: false, reports: [] }),
  config,
};
```

```typescript
// Enregistrement dans index.ts
import openReportStore from './store/open-report';

plugin.addDashboardStore(
  openReportStore.config.namespace,  // 'openReport'
  openReportStore.specifics,
  openReportStore.config
);
```

**Usage dans les composants** :
```typescript
// Accès via $store dans un composant Vue
const reports = this.$store.getters['openReport/getReports'];
await this.$store.dispatch('openReport/fetchReports', clusterId);
```

> **Doc source** : `advanced/stores.md`

---

## 11. Internationalisation

Les traductions sont dans des fichiers YAML sous `l10n/`.

```yaml
# pkg/traefik/l10n/en-us.yaml
traefik:
  headers:
    routes: "Routes"
    entryPoints: "Entry Points"
  ingressRoute:
    ingressClass:
      label: "Ingress Class"
  middleware:
    types:
      label: "Types"
```

**Usage dans les templates** :
```html
<!-- Via composant -->
<t k="traefik.headers.routes" />

<!-- Via interpolation -->
{{ t('traefik.headers.routes') }}
```

**Usage dans le script** :
```typescript
// Dans un composant Vue
const label = this.t('traefik.headers.routes');
```

**Usage dans les configs** (product.js, index.ts) :
```javascript
// Via labelKey (résolu automatiquement par Rancher)
{ labelKey: 'traefik.headers.routes' }
```

**Variables dans les chaînes** :
```yaml
myExtension:
  message: "Il y a {count} éléments"
```
```html
<t k="myExtension.message" :count="5" />
```

> **Doc source** : `advanced/localization.md`

---

## 12. Proxy API

Pour appeler des APIs externes sans problèmes de CORS, utiliser le proxy Rancher.

**Endpoint** : `/meta/proxy/<host>/<path>`

```javascript
// Appel via le proxy Rancher
const response = await this.$store.dispatch('cluster/request', {
  url: '/meta/proxy/api.example.com/v1/resources',
});
```

**En-têtes d'authentification disponibles** :
| En-tête | Transformation |
|---------|---------------|
| `X-Api-Cookie-Header` | → `Cookie` |
| `X-API-Auth-Header` | → `Authorization` |
| `X-Api-CattleAuth-Header` | Authentification Rancher (bearer, basic, awsv4) |

**Pré-requis** : L'host doit être dans la whitelist (Settings > Allowed API Endpoints) ou dans la config du node driver, sinon l'API retourne `503`.

> **Doc source** : `usecases/node-driver/proxying.md`

---

## 13. Compatibilité & annotations Helm

Chaque extension déclare sa compatibilité dans son `package.json` :

```json
{
  "name": "traefik",
  "version": "0.2.2",
  "rancher": {
    "annotations": {
      "catalog.cattle.io/rancher-version": ">= 2.13.0",
      "catalog.cattle.io/ui-extensions-version": ">= 3.0.0 < 4.0.0",
      "catalog.cattle.io/display-name": "Traefik Proxy Extension"
    }
  }
}
```

**Annotations disponibles** :

| Annotation | Usage |
|-----------|-------|
| `catalog.cattle.io/rancher-version` | Version minimale de Rancher (semver range) |
| `catalog.cattle.io/ui-extensions-version` | Version de l'Extensions API — **requis depuis Rancher 2.10** |
| `catalog.cattle.io/kube-version` | Version minimale de Kubernetes |
| `catalog.cattle.io/display-name` | Nom affiché dans l'UI |
| `catalog.cattle.io/host` | Doit valoir `"rancher-manager"` |

**Matrice de compatibilité du projet** :

| Rancher | Shell | Node | Vue |
|---------|-------|------|-----|
| ≥ 2.13.0 | ^3.0.10 | ≥ 24 | 3 |

> **Doc source** : `advanced/version-compatibility.md`, `support-matrix.md`

---

## 14. Workflow de développement

### Commandes

```bash
# Démarrer le serveur de dev (pointe vers un Rancher en cours)
API=https://rancher.127-0-0-1.sslip.io/ yarn dev

# Builder une extension spécifique
yarn build-pkg traefik

# Servir les builds localement (pour Developer Load)
yarn serve-pkgs

# Builder toutes les extensions
yarn build-pkg
```

### Charger une extension dans Rancher (mode développeur)

1. Rancher UI → **Extensions** → **Developer Load**
2. Entrer l'URL : `https://127.0.0.1:4500/traefik-0.2.2/traefik.umd.min.js`
3. L'extension est rechargée sans rebuild de Rancher

### Dev avec le code shell en local (`yarn link`)

Utile pour tester des corrections dans `@rancher/shell` sans publier :

```bash
# Dans le repo rancher-dashboard
cd shell && yarn link

# Dans rancher-ui-extension
yarn link @rancher/shell
API=<URL> yarn dev
```

> **Doc source** : `advanced/yarn-link.md`, `extensions-getting-started.md`

### Workarounds actifs (à jour au 2026-03-30)

| Problème | Solution | Source |
|---------|----------|--------|
| Node 24 incompatible avec `glob@10.4.3` | `"resolutions": { "@achrinza/node-ipc": "9.2.10" }` dans `package.json` | `SHELL_UPGRADE_NOTES.md` |
| Erreurs TypeScript dans `@rancher/shell/types/` | `"skipLibCheck": true` dans `tsconfig.json` | `SHELL_UPGRADE_NOTES.md` |

---

## 15. Composants Rancher réutilisables

Toujours privilégier les composants natifs Rancher pour maintenir la cohérence de l'UI.

**Référence complète** : [Storybook Rancher](https://rancher.github.io/storybook/)

### Composants de formulaire (prioritaires)

| Composant | Import | Usage |
|-----------|--------|-------|
| `LabeledInput` | `@rancher/components` | Tous les champs texte |
| `LabeledSelect` | `@rancher/components` | Sélecteurs (remplace `<select>`) |
| `Checkbox` | `@rancher/components` | Cases à cocher |
| `RadioButton` | `@rancher/components` | Boutons radio |
| `KeyValue` | `@rancher/components` | Labels, annotations, env vars |
| `ArrayList` | `@rancher/components` | Listes d'éléments éditables |
| `Editor` | `@rancher/components` | Éditeur YAML/JSON |
| `UnitInput` | `@rancher/components` | Champs avec unités (CPU, mémoire) |

### Composants d'affichage

| Composant | Import | Usage |
|-----------|--------|-------|
| `Banner` | `@rancher/components` | Messages d'information/erreur |
| `BadgeState` | `@rancher/components` | Badges d'état colorés |
| `Tab` / `Tabs` | `@rancher/components` | Navigation par onglets |
| `Card` | `@rancher/components` | Grouper des sections |
| `Modal` | `@rancher/components` | Boîtes de dialogue |

### Composants Rancher Shell (pages et layouts)

| Composant | Import | Usage |
|-----------|--------|-------|
| `CruResource` | `@shell/components/CruResource` | Wrapper standard création/édition |
| `CreateEditView` | `@shell/mixins/create-edit-view` | Mixin pour formulaires |
| `PaginatedResourceTable` | `@shell/components` | Table avec pagination serveur |
| `ResourceTable` | `@shell/components` | Table standard |
| `DetailTop` | `@shell/components/DetailTop` | En-tête page de détail |

### Exemple d'utilisation dans un formulaire edit

```vue
<template>
  <CruResource
    :resource="value"
    :mode="mode"
    @finish="save"
    @error="handleError"
  >
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="value.metadata.name"
          :mode="mode"
          label-key="generic.name"
          :required="true"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="value.spec.entryPoints"
          :mode="mode"
          label-key="traefik.ingressRoute.entryPoints.label"
          :options="entryPointOptions"
          :multiple="true"
        />
      </div>
    </div>
  </CruResource>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import CruResource from '@shell/components/CruResource.vue';
import LabeledInput from '@rancher/components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@rancher/components/Form/LabeledSelect/LabeledSelect.vue';
import CreateEditView from '@shell/mixins/create-edit-view';

export default defineComponent({
  components: { CruResource, LabeledInput, LabeledSelect },
  mixins:     [CreateEditView],
  props:      { value: Object, mode: String },
});
</script>

<style lang="scss" scoped>
// SCSS scoped uniquement
</style>
```

---

## Références rapides

| Besoin | Fichier à lire |
|--------|---------------|
| Créer un nouveau produit CRD | `usecases/cluster-level-product.md` |
| Ajouter un onglet à une ressource existante | `api/tabs.md` |
| Ajouter une colonne à une liste | `api/table-columns.md` |
| Créer un store Vuex | `advanced/stores.md` |
| Configurer la publication Helm | `publishing.md`, `advanced/workflow-configuration.md` |
| Déployer en air-gapped | `advanced/air-gapped-environments.md` |
| Hooks de navigation | `advanced/hooks.md` |
| Migrer vers une nouvelle version shell | `updating-extensions.md`, `migration.md` |
