# Policy Report Extension

Extension UI pour Rancher Dashboard qui affiche les informations de conformité et de sécurité basées sur les PolicyReports Kubernetes.

## À quoi sert cette extension ?

Cette extension enrichit automatiquement l'interface Rancher avec des indicateurs visuels de conformité pour vos ressources Kubernetes. Elle affiche les résultats des analyses de sécurité et de conformité effectuées par des outils comme Kyverno, Kubewarden ou Falco directement dans l'interface Rancher.

## Fonctionnalités

### Visualisation de la conformité

L'extension ajoute automatiquement :

- **Dans les listes de ressources** : Une colonne "Compliance" avec des badges colorés indiquant le nombre de règles passées/échouées
- **Dans les détails de ressource** : Un onglet "Compliance" avec une table détaillée des résultats d'analyse

### Ressources supportées

- Pods
- Deployments
- StatefulSets
- DaemonSets
- Jobs
- CronJobs
- IngressRoute (Traefik)

### Interface intuitive

- **Badges colorés** : Visualisation rapide du statut de conformité (vert = pass, rouge = fail, orange = warn)
- **Détails extensibles** : Cliquez pour voir les messages détaillés, sources et catégories
- **Groupage intelligent** : Organisation des résultats par sévérité ou par statut
- **Recherche et tri** : Trouvez rapidement les problèmes importants

## Prérequis

### Installation des outils de policy

L'extension nécessite qu'au moins un outil de policy soit installé dans votre cluster :

- **[Kyverno](https://kyverno.io/)** avec Policy Reporter
- **[Kubewarden](https://www.kubewarden.io/)** avec l'audit scanner activé
- **[Falco](https://falco.org/)** ou tout autre outil supportant le standard PolicyReport

Ces outils génèrent des Custom Resource Definitions (CRDs) de type `PolicyReport` que l'extension utilise pour afficher les données.

### Vérification des CRDs

L'extension détecte automatiquement la présence des CRDs nécessaires :
- `wgpolicyk8s.io.policyreport`
- `wgpolicyk8s.io.clusterpolicyreport`

Si ces CRDs ne sont pas présentes, l'extension ne s'affichera pas.

## Utilisation

### Installation

L'extension est installée automatiquement avec le projet rancher-ui-extension. Aucune configuration supplémentaire n'est requise.

### Consultation des résultats

1. **Vue d'ensemble** : Naviguez vers n'importe quelle liste de ressources supportées (ex: Workloads > Pods)
2. **Colonne Compliance** : Observez les badges colorés indiquant le statut de conformité
3. **Détails** : Cliquez sur une ressource pour accéder à l'onglet "Compliance" avec tous les détails

### Interprétation des résultats

- **Pass (vert)** : La ressource respecte la règle
- **Fail (rouge)** : La ressource viole la règle - action requise
- **Warn (orange)** : Avertissement - à surveiller
- **Error (gris)** : Erreur lors de l'évaluation de la règle
- **Skip (bleu)** : Règle non applicable ou ignorée

## Compatibilité

- **Rancher** : Version 2.12.0 ou supérieure (supporte la pagination côté serveur)
- **Navigateurs** : Tous les navigateurs modernes supportés par Rancher

## Support et documentation

- **Documentation technique** : Voir [TECHNICAL.md](./TECHNICAL.md)
- **Standard PolicyReport** : [Kubernetes Policy WG](https://github.com/kubernetes-sigs/wg-policy-prototypes)
- **Issues** : Signaler sur le repository GitHub du projet
