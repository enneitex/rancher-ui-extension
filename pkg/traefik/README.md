# Traefik Extension

Extension UI pour Rancher Dashboard qui facilite la gestion des ressources Traefik Proxy dans votre cluster Kubernetes.

## À quoi sert cette extension ?

Cette extension améliore l'expérience de gestion de Traefik dans Rancher en fournissant des interfaces dédiées pour créer et éditer les ressources spécifiques à Traefik. Au lieu d'éditer du YAML brut, vous disposez de formulaires intuitifs avec validation et aide contextuelle.

## Fonctionnalités

### Ressources Traefik supportées

#### IngressRoute (HTTP/HTTPS)
- **Formulaire d'édition complet** : Interface graphique pour configurer les routes HTTP/HTTPS
- **Gestion des routes** : Ajout, modification et suppression de règles de routage
- **Configuration TLS avancée** :
  - Sélection de certificats
  - Configuration des domaines TLS
  - Support des TLSStore pour la gestion centralisée
- **Sélection des middlewares** : Interface pour associer des middlewares aux routes
- **IngressClass** : Configuration de la classe d'ingress Traefik

#### IngressRouteTCP
- **Support complet** : Gestion des routes TCP
- **Configuration TLS** : Support du TLS passthrough et termination
- **Services TCP** : Configuration des services backend TCP

#### TLSOption
- **Visualisation** : Affichage des configurations TLS
- **Gestion** : Création et modification des options TLS (versions, ciphers, courbes)

#### Middleware
- **Vue liste personnalisée** : Affichage optimisé des middlewares
- **Vue détail** : Consultation détaillée des configurations
- **Édition** : Via YAML (formulaire d'édition à venir)
