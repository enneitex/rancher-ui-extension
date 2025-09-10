# Tests Unitaires - HostMatch.vue

## Vue d'ensemble

Ce dossier contient les tests unitaires pour le composant `HostMatch.vue`, un formatter utilisé dans les listes d'IngressRoute Traefik pour afficher des liens cliquables vers les applications web configurées.

## Configuration des Tests

### Framework
- **Jest** : Framework de test principal
- **Environnement** : jsdom (pour simuler le DOM)
- **Pattern** : Tests de logique métier sans montage de composant Vue

### Scripts Disponibles
```bash
npm run test                 # Exécuter tous les tests
npm run test:watch          # Exécuter les tests en mode watch
npm run test:coverage       # Exécuter avec rapport de couverture
```

## Structure des Tests

### HostMatch.test.js

Le fichier principal teste la logique de génération d'URLs cliquables :

#### Tests Paramétrés (`it.each`)
- **Parsing des règles Host()** : Extraction des hostnames depuis les patterns Traefik
- **Détection de protocole** : HTTPS automatique selon entryPoints et configuration TLS  
- **Gestion des paths** : Support de Path() et PathPrefix()
- **Hosts multiples** : Extraction du premier host seulement

#### Cas de Test Couverts

1. **Règles de match simples**
   ```javascript
   Host(`example.com`) → http://example.com
   ```

2. **HTTPS automatique** 
   ```javascript
   Host(`example.com`) + websecure entrypoint → https://example.com
   Host(`example.com`) + TLS config → https://example.com
   ```

3. **Combinaisons Host + Path**
   ```javascript
   Host(`example.com`) && Path(`/api`) → http://example.com/api
   ```

4. **Hosts multiples**
   ```javascript
   Host(`app1.com,app2.com`) → http://app1.com (premier seulement)
   ```

5. **Cas d'erreur**
   ```javascript
   PathPrefix(`/api`) → null (pas de host)
   InvalidRule → null
   ```

## Logique Testée

### calculatePrimaryUrl()
Fonction principale qui :
- Parse les règles de match Traefik
- Extrait le premier hostname
- Détecte le protocole (HTTP/HTTPS)
- Construit l'URL finale
- Valide l'URL générée

### Détection de Protocole
- **HTTPS si** : entryPoints contient 'websecure' OU configuration TLS présente
- **HTTP sinon** : Comportement par défaut

### Validation d'URL
- Utilise `new URL()` pour valider la syntaxe
- Retourne `null` pour les URLs invalides

## Exemple d'Exécution

```bash
$ npm run test

PASS pkg/traefik/formatters/__tests__/HostMatch.test.js
  HostMatch formatter logic
    ✓ should calculate URL for match rule: Host(`example.com`)
    ✓ should detect protocol correctly for entryPoints=["websecure"] tls=null
    ✓ should extract first host from multiple hosts
    ✓ should validate URLs correctly
    
Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

## Bonnes Pratiques Respectées

### Style Dashboard Rancher
- **Nomenclature** : `describe('component: HostMatch formatter')`
- **Tests paramétrés** : Utilisation extensive de `it.each()`
- **Mocks minimaux** : Seulement les dépendances nécessaires
- **Assertions simples** : Focus sur la lisibilité

### Couverture
- **Tous les cas d'usage** : Liens cliquables, fallback texte, détection protocole
- **Cas d'erreur** : Règles malformées, données manquantes
- **Edge cases** : Hosts multiples, paths complexes

## Extensions Futures

Pour une couverture plus complète, on pourrait ajouter :
1. **Tests d'intégration** : Montage complet du composant Vue
2. **Tests d'accessibilité** : Attributs ARIA, navigation clavier
3. **Tests de performance** : Parsing de règles complexes
4. **Tests visuels** : Snapshots des rendus HTML

## Contribution

Lors de l'ajout de nouvelles fonctionnalités à `HostMatch.vue` :
1. Ajouter les cas de test correspondants
2. Maintenir la couverture > 90%
3. Respecter les patterns `it.each()` pour les cas multiples
4. Documenter les nouveaux scénarios dans ce README