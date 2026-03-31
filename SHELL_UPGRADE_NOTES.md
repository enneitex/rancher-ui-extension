# Notes de mise à jour shell

## Workarounds temporaires introduits pour @rancher/shell 3.0.10

Ces éléments sont des contournements de bugs upstream et devront être réévalués à chaque montée de version du shell.

---

### 1. `package.json` — résolution `@achrinza/node-ipc: 9.2.10`

**Raison** : `@achrinza/node-ipc@9.2.9` (dépendance transitive de `@vue/cli-service@5.0.x`) déclare une contrainte moteur qui exclut Node 24. La version `9.2.10` ajoute le support de Node 24 et 25.

**À faire** : Supprimer cette résolution si une version future du shell embarque une version de `@vue/cli-service` qui dépend d'`@achrinza/node-ipc >= 9.2.10`.

---

### 2. `tsconfig.json` — `"skipLibCheck": true`

**Raison** : Les fichiers `@rancher/shell/types/shell/index.d.ts` et `@rancher/shell/types/rancher/index.d.ts` contiennent plusieurs erreurs incompatibles avec TypeScript 5 (redéclarations `TS2451`, contextes ambients mal formés `TS1038`, types manquants `TS2304`).

**À faire** : Tester la suppression de `"skipLibCheck": true` dans `tsconfig.json` après une montée de version du shell pour vérifier si les types sont corrigés. Si le projet ne remonte aucune erreur sans ce flag, le retirer.
