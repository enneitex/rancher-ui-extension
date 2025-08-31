# Extension UI Traefik pour Rancher - Documentation Technique

## Vue d'ensemble du projet rancher-ui-extension

### Architecture générale
Le projet `rancher-ui-extension` est une extension UI pour Rancher qui améliore la gestion des Custom Resource Definitions (CRDs). Il suit l'architecture modulaire de Rancher avec un système de plugins.

### Structure actuelle
```
rancher-ui-extension/
├── pkg/
│   ├── traefik/                    # Module principal Traefik
│   │   ├── index.ts               # Point d'entrée du plugin
│   │   ├── package.json           # Métadonnées du module
│   │   ├── list/                  # Vues de liste personnalisées
│   │   │   └── traefik.io.ingressroute.vue
│   │   ├── pages/                 # Pages de l'extension
│   │   └── routing/               # Configuration des routes
│   └── victoria-metrics/          # Module Victoria Metrics
├── package.json                   # Configuration principale
└── node_modules/                  # Dépendances
```

### Fonctionnement technique

#### 1. Système de plugins
- **Point d'entrée**: `pkg/traefik/index.ts` exporte une fonction qui reçoit un objet `IPlugin`
- **Auto-import**: Utilise `importTypes()` pour découvrir automatiquement les composants
- **Enregistrement**: `plugin.register()` associe les composants aux types de ressources

#### 2. Composants actuels
- **IngressRouteList**: Vue de liste basique utilisant le composant `ResourceList` standard
- **État actuel**: Vue minimaliste sans personnalisation UI

#### 3. Configuration Rancher
- **Version compatible**: Rancher >= 2.10.0 
- **UI Extensions**: Version 3.0.0 < 4.0.0
- **Dépendance principale**: `@rancher/shell`

---

## Plan de Développement - Extension UI Traefik

### **Phase 1: Architecture et Structure** 
**Objectif**: Établir une architecture solide basée sur les meilleures pratiques observées

**Structure recommandée** (inspirée de kubewarden-ui et capi-ui-extension):
```
pkg/traefik/
├── components/           # Composants réutilisables
│   ├── TraefikRouteBuilder.vue
│   ├── MiddlewareSelector.vue
│   └── ServiceSelector.vue
├── detail/              # Vues de détail personnalisées
│   ├── traefik.io.ingressroute.vue
│   ├── traefik.io.middleware.vue
│   └── traefik.io.tlsoption.vue
├── edit/                # Formulaires d'édition personnalisés
│   ├── traefik.io.ingressroute.vue
│   ├── traefik.io.middleware.vue
│   └── traefik.io.tlsoption.vue
├── list/                # Vues de liste personnalisées (existant)
│   └── traefik.io.ingressroute.vue
├── models/              # Modèles de données
│   ├── ingressroute.js
│   └── middleware.js
├── formatters/          # Formateurs pour l'affichage
│   ├── RouteStatus.vue
│   └── MiddlewareType.vue
└── utils/               # Utilitaires spécifiques
    ├── validation.js
    └── traefik-helpers.js
```

### **Phase 2: CRDs Traefik Prioritaires**
1. **IngressRoute** (déjà commencé) - Améliorer la vue existante
2. **Middleware** - Créer vues edit/detail personnalisées  
3. **TLSOption** - Interface pour configuration TLS
4. **ServersTransport** - Gestion des transports serveur
5. **TraefikService** - Services Traefik personnalisés

### **Phase 3: Composants UI Personnalisés**
- **Formulaires intelligents**: Auto-complétion pour hosts, paths, services Kubernetes
- **Visualiseur de règles**: Interface graphique pour les règles de routage
- **Validateur en temps réel**: Validation des configurations avant sauvegarde
- **Aperçu YAML**: Basculement facile entre interface graphique et YAML

### **Phase 4: Fonctionnalités Avancées**
- **Assistant de création**: Wizard step-by-step pour les configurations complexes
- **Templates prédéfinis**: Templates courants (redirect HTTPS, load balancing, etc.)
- **Visualisation des relations**: Graphique des dépendances entre ressources
- **Mode debug**: Outils de diagnostic intégrés pour le troubleshooting

### **Phase 5: Tests et Documentation**
- **Tests unitaires**: Suivre l'exemple de kubewarden-ui (Jest + Vue Test Utils)
- **Tests d'intégration**: Validation end-to-end des formulaires
- **Documentation**: Guides utilisateur et développeur
- **Storybook**: Documentation des composants (optionnel)

### **Technologies Recommandées**
- **Framework**: Vue 3 + TypeScript (aligné sur kubewarden-ui)
- **Composants**: `@rancher/components` et `@rancher/shell`
- **Validation**: Schemas JSON pour validation des configurations
- **Tests**: Jest + Vue Test Utils (comme kubewarden-ui)
- **Build**: Vue CLI avec configuration personnalisée

### **Points d'Extension Clés**
```typescript
// Dans index.ts
plugin.register('edit', 'traefik.io.ingressroute', CustomEditComponent);
plugin.register('detail', 'traefik.io.ingressroute', CustomDetailComponent);
plugin.register('list', 'traefik.io.middleware', CustomListComponent);
plugin.register('list', 'traefik.io.tlsoption', TLSOptionList);
```

### **Améliorations par rapport à l'existant**
- **Remplacement de la vue liste basique**: Composants riches au lieu du `ResourceList` générique
- **Formulaires métier**: Interfaces spécifiques aux besoins Traefik au lieu du YAML brut
- **Validation intelligente**: Contrôles de cohérence en temps réel
- **UX améliorée**: Navigation intuitive et workflow optimisé

### **Migration recommandée**
1. Conserver l'architecture existante (`pkg/traefik/`)
2. Étendre progressivement avec les nouveaux composants
3. Maintenir la compatibilité avec les versions Rancher supportées
4. Tester chaque phase avant de passer à la suivante

---

## Notes de développement

### Commandes utiles
```bash
# Développement local (IMPORTANT: utiliser yarn, pas npm)
API=rancher.dev.local yarn dev

# Build de l'extension
npm run build-pkg

# Tests (à ajouter)
npm run test:unit
```

### Notes importantes
- **TOUJOURS utiliser `yarn dev` pour le développement local** - une instance est déjà lancée
- Ne jamais lancer `npm run dev` ou `npm start` - cela interfère avec l'instance existante
- Claude ne doit jamais lancer de commandes de build automatiquement

### Bonnes pratiques observées
- Utiliser `@rancher/shell` pour l'intégration Rancher
- Suivre les conventions de nommage des extensions
- Implémenter des tests unitaires systématiques
- Maintenir la compatibilité avec les versions Rancher

Ce plan s'appuie sur l'architecture existante et les meilleures pratiques observées dans les extensions de référence (capi-ui-extension et kubewarden-ui).