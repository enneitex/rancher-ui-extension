# Traefik Extension - Documentation Technique

## Architecture

### Structure du module
```
pkg/traefik/
├── index.ts               # Point d'entrée du plugin
├── package.json           # Métadonnées du module
├── edit/                  # Formulaires d'édition personnalisés
│   └── traefik.io.ingressroute/  # Formulaire IngressRoute complet
│       ├── index.vue              # Composant principal
│       ├── Routes.vue             # Gestion des routes
│       ├── Route.vue              # Édition d'une route
│       ├── RouteService.vue       # Sélection de service
│       ├── RouteMiddlewares.vue   # Sélection de middlewares
│       ├── TLSConfiguration.vue   # Configuration TLS
│       ├── TLSDomains.vue         # Gestion des domaines TLS
│       ├── TLSDomain.vue          # Édition d'un domaine
│       ├── TLSStores.vue          # Sélection du TLSStore
│       └── IngressClassTab.vue    # Onglet Ingress Class
├── list/                  # Vues de liste personnalisées
│   └── traefik.io.ingressroute.vue
├── models/                # Modèles de données
├── components/            # Composants réutilisables
├── formatters/            # Formatters pour les colonnes
├── config/                # Configuration
├── routing/               # Configuration des routes
├── l10n/                  # Internationalisation
│   └── en-us.yaml         # Traductions anglaises
├── assets/                # Ressources statiques
│   └── icon-traefik.svg  # Icône Traefik
└── examples/              # Exemples de configuration
```

### Composants principaux

#### Formulaire IngressRoute

Le formulaire d'édition IngressRoute est composé de plusieurs sous-composants modulaires :

**index.vue (Composant principal)**
- Gère l'état global du formulaire
- Organise les onglets (General, TLS, IngressClass)
- Valide et sauvegarde la ressource
- Utilise le mixin `CreateEditView` de Rancher

**Routes.vue**
- Gestion de la liste des routes HTTP
- Ajout/suppression de routes
- Interface drag & drop pour réordonner

**Route.vue**
- Configuration d'une route individuelle
- Champs : match rule, priority, services, middlewares
- Validation des expressions de routage

**RouteService.vue**
- Sélecteur de service Kubernetes
- Configuration du port et du poids
- Support des services externes

**RouteMiddlewares.vue**
- Multi-sélecteur de middlewares
- Affichage avec namespace
- Validation de l'existence

**TLSConfiguration.vue**
- Activation/désactivation TLS
- Choix entre certificat inline et TLSStore
- Configuration des options TLS

**TLSDomains.vue & TLSDomain.vue**
- Gestion multi-domaines
- Association certificat par domaine
- Support wildcard

**TLSStores.vue**
- Sélection du TLSStore (default ou custom)
- Validation de l'existence

**IngressClassTab.vue**
- Configuration de l'IngressClass
- Permet de cibler un contrôleur Traefik spécifique

### Intégration Rancher

#### Point d'entrée (index.ts)

```typescript
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';

export default function(plugin: IPlugin): void {
  // Auto-import des composants edit/list/detail
  importTypes(plugin);

  // Métadonnées du plugin
  plugin.metadata = require('./package.json');
}
```

#### Auto-import

Le système `importTypes` de Rancher détecte automatiquement :
- Les composants dans `edit/` pour l'édition des ressources
- Les composants dans `list/` pour les vues liste personnalisées
- Les composants dans `detail/` pour les vues détail

La convention de nommage est importante :
- `edit/traefik.io.ingressroute/` → Édition des IngressRoute
- `list/traefik.io.ingressroute.vue` → Liste des IngressRoute

### Gestion des données

#### Modèles de ressources

Les ressources Traefik suivent le modèle standard Kubernetes :

```typescript
interface IngressRoute {
  apiVersion: 'traefik.io/v1alpha1';
  kind: 'IngressRoute';
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    entryPoints: string[];
    routes: Route[];
    tls?: TLSConfiguration;
  };
}
```

#### Validation

La validation se fait à plusieurs niveaux :
1. **Client-side** : Validation des champs requis dans les composants Vue
2. **Schema** : Validation contre le schema CRD si disponible
3. **Server-side** : Validation finale par l'API Kubernetes

### Internationalisation

Les traductions sont dans `l10n/en-us.yaml` :

```yaml
traefik:
  ingressRoute:
    routes:
      label: Routes
      add: Add Route
    service:
      label: Service
      namespace: Namespace
    # ...
```

Utilisation dans les composants :
```vue
{{ t('traefik.ingressRoute.routes.label') }}
```

### Configuration des listes

Les vues liste peuvent être personnalisées via `list/traefik.io.ingressroute.vue` :
- Colonnes personnalisées
- Filtres spécifiques
- Actions contextuelles

## Server-Side Pagination

Depuis Rancher 2.12, le support de la pagination côté serveur est disponible. L'extension est compatible avec cette fonctionnalité :

- Les composants liste héritent automatiquement du support
- La configuration se fait au niveau de Rancher
- Améliore les performances pour les grandes listes

## Développement

### Prérequis

- Node.js v20 (pour Rancher 2.10+)
- Yarn
- Instance Rancher accessible

### Commandes

```bash
# Développement local
API=rancher.dev.local yarn dev

# Build de l'extension
yarn build-pkg traefik

# Tests (à implémenter)
yarn test
```

### Bonnes pratiques

1. **Composants Rancher** : Utiliser les composants `@rancher/shell` et `@rancher/components`
2. **Mixins** : Exploiter les mixins Rancher (CreateEditView, ResourceTable, etc.)
3. **Validation** : Toujours valider côté client ET serveur
4. **Performance** : Utiliser la pagination et le lazy loading
5. **Accessibilité** : Labels et ARIA attributes

### Debugging

Pour debugger l'extension :
1. Utiliser les Vue DevTools
2. Console logs avec `console.log('[traefik]', ...)`
3. Breakpoints dans le code source

## Améliorations futures

### Court terme
- [ ] Support IngressRouteTCP
- [ ] Support IngressRouteUDP
- [ ] Tests unitaires avec Jest
- [ ] Validation avancée des règles de routage

### Long terme
- [ ] Éditeur visuel de routes (drag & drop)
- [ ] Import/Export de configurations
- [ ] Templates de configuration
- [ ] Intégration avec le monitoring Traefik

## Références

- [Traefik Documentation](https://doc.traefik.io/)
- [Traefik CRDs](https://doc.traefik.io/traefik/reference/dynamic-configuration/kubernetes-crd/)
- [Rancher Extensions Guide](https://extensions.rancher.io/)
- [Vue.js 3](https://vuejs.org/)