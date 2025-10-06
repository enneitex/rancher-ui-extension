# Rancher UI Extensions Collection

Collection d'extensions UI pour Rancher Dashboard améliorant la gestion de diverses ressources Kubernetes et outils Cloud Native.

## 📦 Extensions disponibles

### 1. Policy Report Extension

Extension pour visualiser les rapports de conformité et de sécurité dans Rancher.

- Affiche les résultats des analyses de sécurité (Kyverno, Kubewarden, Falco)
- Indicateurs visuels de conformité sur les ressources
- Support des PolicyReports standards Kubernetes

[Documentation détaillée →](pkg/policy-report/README.md)

### 2. Traefik Extension

Interface graphique dédiée pour gérer les ressources Traefik Proxy.

- Formulaires d'édition pour IngressRoute
- Configuration TLS avancée
- Gestion des middlewares et services

[Documentation détaillée →](pkg/traefik/README.md)

### 3. Victoria Metrics Extension
**Statut** : 🚧 En développement

Intégration future de Victoria Metrics pour le monitoring.

[Documentation détaillée →](pkg/victoria-metrics/README.md)

## 🚀 Installation

### Prérequis

- **Rancher** : Version 2.12.0 ou supérieure
- **Node.js** : v20 (pour le développement)
- **Yarn** : Gestionnaire de paquets

### Installation des extensions

```bash
# Cloner le repository
git clone https://github.com/enneitex/rancher-ui-extension.git
cd rancher-ui-extension

# Installer les dépendances
yarn install

# Build toutes les extensions
yarn build-pkg
```

### Développement local

```bash
# Lancer en mode développement
API=https://your-rancher-url yarn dev

# Build une extension spécifique
yarn build-pkg policy-report
yarn build-pkg traefik

# Servir les packages localement
yarn serve-pkgs
```

Puis dans Rancher :
1. Aller dans User Avatar > Preferences
2. Activer "Developer Tools & Features"
3. Dans "UI Extension Developer Load", entrer l'URL du serveur local

## 📋 Fonctionnalités communes

### Server-Side Pagination (Rancher 2.12+)

Toutes les extensions supportent la pagination côté serveur introduite dans Rancher 2.12, améliorant les performances pour les grandes listes de ressources.

### Internationalisation

Les extensions supportent plusieurs langues via le système i18n de Rancher. Actuellement disponible :
- Anglais (en-us)

### Composants Rancher

Les extensions utilisent les composants standards Rancher pour une expérience utilisateur cohérente :
- LabeledInput, LabeledSelect
- Cards, Tabs, Modals
- ResourceTable, ArrayList
- Badges, Banners

## 🛠️ Architecture

Les extensions suivent l'architecture standard Rancher Extensions v3 :

```
rancher-ui-extension/
├── pkg/                      # Extensions
│   ├── policy-report/        # Extension Policy Report
│   ├── traefik/             # Extension Traefik
│   └── victoria-metrics/    # Extension Victoria Metrics
├── scripts/                  # Scripts de build
├── package.json             # Configuration principale
└── README.md                # Cette documentation
```

Chaque extension contient :
- `README.md` : Documentation utilisateur
- `TECHNICAL.md` : Documentation technique (si applicable)
- `index.ts` : Point d'entrée
- `package.json` : Métadonnées de l'extension

## 📚 Documentation

- **Guide de développement** : [DEVELOPMENT.md](DEVELOPMENT.md)
- **Documentation Rancher Extensions** : [extensions.rancher.io](https://extensions.rancher.io/)
- **Storybook Rancher** : [rancher.github.io/storybook](https://rancher.github.io/storybook/)

## TODO

### Server-Side Pagination (Rancher 2.12+)

Adapter les extensions pour supporter la pagination