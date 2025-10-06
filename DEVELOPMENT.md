# Documentation Développement - Rancher UI Extensions

## Vue d'ensemble du projet rancher-ui-extension

### Architecture générale
Le projet `rancher-ui-extension` est une extension UI pour Rancher qui améliore la gestion des Custom Resource Definitions (CRDs). Il suit l'architecture modulaire de Rancher avec un système de plugins.

### Contexte Rancher Extensions
Les extensions Rancher fournissent un mécanisme pour ajouter de nouvelles fonctionnalités à l'interface Dashboard au runtime. Elles sont:
- Développées indépendamment de Rancher dans des repos GitHub séparés
- Compilées comme des librairies Vue
- Packagées avec un Helm chart pour faciliter l'installation
- Conçues pour étendre dynamiquement les fonctionnalités de l'UI

**Note importante**: Avec la version v2.10 de Rancher, une nouvelle version (v3) de la documentation et des extensions a été introduite, migrant de Vue2 vers Vue3. Notre extension utilise déjà Vue3 et suit les bonnes pratiques actuelles.

#### Prérequis de développement
- **Node.js**: v20 pour Rancher v2.10+ (v16 pour les versions legacy v2.7-v2.9)
- **Yarn**: Gestionnaire de paquets requis
- **Rancher**: Instance installée et accessible

#### Workflow de développement
1. **Création d'une extension**: `npm init @rancher/extension my-app`
2. **Développement local**: `API=<Rancher Backend URL> yarn dev`
3. **Build de l'extension**: `yarn build-pkg my-app`
4. **Service des packages**: `yarn serve-pkgs`
5. **Chargement dans Rancher**: Via Developer Load dans les préférences UI

#### Structure d'extension standard
- `./pkg/my-app/index.ts`: Point d'entrée et initialisation de l'extension
- `./pkg/my-app/product.ts`: Configuration du produit
- `./routing/extension-routing.js`: Définition des routes
- Les extensions peuvent enregistrer des composants pour différents types de ressources CRD

### Structure actuelle
```
rancher-ui-extension/
├── pkg/
│   ├── traefik/                    # Module principal Traefik
│   │   ├── index.ts               # Point d'entrée du plugin
│   │   ├── package.json           # Métadonnées du module
│   │   ├── edit/                  # Formulaires d'édition personnalisés
│   │   │   └── traefik.io.ingressroute/  # Formulaire IngressRoute complet
│   │   │       ├── index.vue              # Composant principal
│   │   │       ├── Routes.vue             # Gestion des routes
│   │   │       ├── Route.vue              # Édition d'une route
│   │   │       ├── RouteService.vue       # Sélection de service
│   │   │       ├── RouteMiddlewares.vue   # Sélection de middlewares
│   │   │       ├── TLSConfiguration.vue   # Configuration TLS
│   │   │       ├── TLSDomains.vue         # Gestion des domaines TLS
│   │   │       ├── TLSDomain.vue          # Édition d'un domaine
│   │   │       ├── TLSStores.vue          # Sélection du TLSStore
│   │   │       └── IngressClassTab.vue    # Onglet Ingress Class
│   │   ├── list/                  # Vues de liste personnalisées
│   │   │   └── traefik.io.ingressroute.vue
│   │   ├── models/                # Modèles de données (vide actuellement)
│   │   ├── pages/                 # Pages de l'extension
│   │   ├── routing/               # Configuration des routes
│   │   └── l10n/                  # Internationalisation
│   │       └── en-us.yaml         # Traductions anglaises
│   └── victoria-metrics/          # Module Victoria Metrics
├── package.json                   # Configuration principale
└── node_modules/                  # Dépendances
```

### Fonctionnement technique

#### 1. Système de plugins
- **Point d'entrée**: `pkg/traefik/index.ts` exporte une fonction qui reçoit un objet `IPlugin`
- **Auto-import**: Utilise `importTypes()` pour découvrir automatiquement les composants
- **Enregistrement**: `plugin.register()` associe les composants aux types de ressources


#### 2. Configuration Rancher
- **Version compatible**: Rancher >= 2.10.0
- **UI Extensions**: Version 3.0.0 < 4.0.0
- **Dépendance principale**: `@rancher/shell`

---

## Plan de Développement - Extension UI Traefik

### **Phase 1: Architecture et Structure** ✅ COMPLÉTÉE
**Objectif**: Établir une architecture solide basée sur les meilleures pratiques observées

**Réalisations**:
- ✅ Formulaire d'édition IngressRoute complet et fonctionnel
- ✅ Architecture modulaire avec composants réutilisables
- ✅ Gestion avancée de la configuration TLS
- ✅ Support des TLSStore pour la gestion centralisée des certificats
- ✅ Interface utilisateur avec onglets (General, TLS, IngressClass)
- ✅ Validation des données en temps réel
- ✅ Internationalisation mise en place

### **Phase 2: CRDs Traefik Prioritaires** 🚧 EN COURS
1. **IngressRoute** ✅ COMPLÉTÉ - Formulaire d'édition complet avec support TLS avancé
2. **IngressRouteTCP** ⏳ À FAIRE - Créer vues edit/list/detail pour gérer les IngressRouteTCP

### **Phase 5: Tests et Documentation**
- **Tests unitaires**: Suivre l'exemple de kubewarden-ui (Jest + Vue Test Utils)
- **Tests d'intégration**: Validation end-to-end des formulaires
- **Documentation**: Guides utilisateur et développeur

### **Technologies Recommandées**
- **Framework**: Vue 3 + TypeScript (aligné sur kubewarden-ui)
- **Composants**: `@rancher/components` et `@rancher/shell`
- **Validation**: Schemas JSON pour validation des configurations
- **Tests**: Jest + Vue Test Utils (comme kubewarden-ui)
- **Build**: Vue CLI avec configuration personnalisée
---

## Notes de développement

### Commandes utiles

```bash
API=rancher.dev.local yarn dev
```



### Bonnes pratiques à respecter
- Utilisation de `@rancher/shell` pour l'intégration Rancher
- Respect des conventions de nommage des extensions
- Architecture modulaire avec composants réutilisables, si possible issus directement de rancher
- réutiliser les components de rancher pour garder une unicité dans l'UI
- Internationalisation avec fichiers de traduction
- Tests unitaires à implémenter

### Composants Rancher disponibles dans le Storybook

#### Composants de base (Components)
- **Alert**: Affichage de messages d'alerte
- **ArrayList**: Gestion de listes d'éléments
- **BadgeState**: Badges d'état visuels
- **Banner**: Bannières d'information
- **Card**: Cartes pour grouper du contenu
- **Collapse**: Sections collapsibles
- **ConsumptionGauge**: Jauges de consommation
- **DetailTop**: En-tête de détail
- **Growl**: Notifications toast
- **IconIsDefault**: Icône par défaut
- **IconMessage**: Messages avec icônes
- **KeyValue**: Paires clé-valeur
- **LabeledTooltip**: Tooltips avec labels
- **Modal**: Fenêtres modales
- **PercentageBar**: Barres de pourcentage
- **Pill**: Pills/badges arrondis
- **SimpleBox**: Boîtes simples
- **StatusBadge**: Badges de statut
- **StringList**: Listes de chaînes
- **Tab**: Onglets de navigation
- **Table**: Tables de données

#### Composants de formulaire (Form)
- **Button**: Boutons standards
- **ButtonDropdown**: Boutons avec dropdown
- **Checkbox**: Cases à cocher
- **Editor**: Éditeur de code (supporte YAML, JSON, etc.)
- **FileSelector**: Sélecteur de fichiers
- **LabeledInput**: Champs de saisie avec labels
  - Support des statuts: info, success, warning, error
  - Support des subLabels et tooltips
  - Type cron avec validation
  - Type multiline
- **Password**: Champs mot de passe
- **RadioButton**: Boutons radio
- **Select**: Listes déroulantes
- **TextAreaAutoGrow**: Zones de texte auto-extensibles
- **ToggleSwitch**: Interrupteurs on/off
- **UnitInput**: Champs avec unités
- **LabeledSelect**: Select avec labels
- **RadioGroupButton**: Groupes de boutons radio

#### Composants à utiliser prioritairement dans notre extension
Pour maintenir la cohérence avec l'UI Rancher:
- `LabeledInput` pour tous les champs de saisie
- `LabeledSelect` pour les sélecteurs
- `ButtonDropdown` pour les actions multiples
- `Card` pour grouper les sections
- `Tab` pour la navigation entre sections
- `Banner` et `Alert` pour les messages
- `Modal` pour les confirmations
- `Editor` pour l'édition YAML/JSON
- `KeyValue` pour les labels/annotations
- `ArrayList` pour les listes dynamiques

### Ressources utiles
- **Documentation officielle Rancher Extensions v3**: https://extensions.rancher.io/extensions/next/home
- **Storybook Rancher**: https://rancher.github.io/storybook/ - Catalogue complet des composants UI
- **Exemples d'extensions**: https://github.com/rancher/ui-plugin-examples
- **Extensions de référence**:
  - kubewarden-ui (composants réutilisables et tests)

### Patterns et bonnes pratiques issues de la documentation
- **Chargement dynamique**: Les extensions sont chargées au runtime sans rebuild de Rancher
- **Packaging Helm**: Distribution via Helm charts pour faciliter l'installation
- **Developer Load**: Mode développeur pour tester les extensions localement
- **Versioning**: Aligner les tags d'extension avec les versions de Rancher
- **API Proxying**: Utiliser le mécanisme de proxy de Rancher pour les API externes
- **Credential Management**: Définir clairement `privateCredentialFields` et `publicCredentialFields`

Ce projet s'appuie sur l'architecture existante et les meilleures pratiques observées dans les extensions de référence et la documentation officielle Rancher Extensions v3.
