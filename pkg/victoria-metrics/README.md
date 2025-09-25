# Victoria Metrics Extension pour Rancher Dashboard

Cette extension permet d'intégrer Victoria Metrics comme système de monitoring dans le Dashboard Rancher, avec fallback automatique vers Prometheus.

## Fonctionnalités

- **Détection automatique** : Détecte la présence de Victoria Metrics et Prometheus
- **Fallback intelligent** : Utilise Victoria Metrics en priorité, sinon Prometheus
- **Overrides transparents** : Remplace les vues Pod, Node, Workload et Cluster Explorer
- **Configuration flexible** : Support de configurations par cluster
- **Compatibilité** : Compatible avec les URLs et dashboards Prometheus existants

## Configuration

### Configuration par défaut

```javascript
// Configuration automatique
Namespace: victoria-metrics-system
Service: victoria-metrics-grafana
Port: 3000
```

### Configuration personnalisée via ConfigMap

Créer un ConfigMap dans le namespace `cattle-system` :

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: victoria-metrics-config
  namespace: cattle-system
data:
  namespace: "mon-vm-namespace"
  service: "mon-vm-grafana"
  port: "3000"
  customEndpoints: |
    {
      "cluster-1": {
        "namespace": "vm-cluster-1",
        "service": "grafana-cluster-1",
        "port": "3000"
      }
    }
  dashboardMapping: |
    {
      "rancher-pod-containers-1": "vm-pod-containers",
      "rancher-pod-1": "vm-pod-summary"
    }
```

### Configuration par variables d'environnement

```bash
VM_NAMESPACE=victoria-metrics-system
VM_SERVICE=victoria-metrics-grafana
VM_PORT=3000
```

## Dashboards Victoria Metrics

### Mapping des dashboards Rancher vers Victoria Metrics

| Rancher Dashboard | Victoria Metrics Equivalent |
|------------------|------------------------------|
| `rancher-pod-containers-1` | `vm-pod-containers` |
| `rancher-pod-1` | `vm-pod-summary` |
| `rancher-node-detail-1` | `vm-node-detail` |
| `rancher-node-1` | `vm-node-summary` |
| `rancher-workload-pods-1` | `vm-workload-pods` |
| `rancher-workload-1` | `vm-workload-summary` |
| `rancher-cluster-nodes-1` | `vm-cluster-nodes` |
| `rancher-cluster-1` | `vm-cluster-summary` |
| `rancher-k8s-components-nodes-1` | `vm-k8s-components-nodes` |
| `rancher-k8s-components-1` | `vm-k8s-components` |
| `rancher-etcd-nodes-1` | `vm-etcd-nodes` |
| `rancher-etcd-1` | `vm-etcd-summary` |

## Utilisation

### Installation

1. Construire l'extension :
```bash
yarn build-pkg victoria-metrics
```

2. Servir les packages :
```bash
yarn serve-pkgs
```

3. Charger dans Rancher via Developer Tools

### Développement

```bash
API=rancher.dev.local yarn dev
```

## Architecture

```
pkg/victoria-metrics/
├── components/
│   ├── VictoriaMetricsDashboard.vue  # Dashboard component avec détection
│   └── VictoriaMetricsWrapper.vue    # Wrapper pour DashboardMetrics
├── config/
│   └── endpoints.js                  # Configuration des endpoints
├── detail/
│   ├── pod.vue                       # Override vue Pod
│   ├── node.vue                      # Override vue Node
│   └── workload.vue                  # Override vue Workload
├── pages/
│   └── c/_cluster/explorer.vue       # Override Cluster Explorer
├── utils/
│   └── victoria-metrics.js           # Utilitaires VM
└── l10n/
    └── en-us.yaml                    # Traductions
```

## Fallback automatique

L'extension détecte automatiquement les systèmes de monitoring disponibles :

1. **Victoria Metrics** : Si détecté et dashboards disponibles → utilisation
2. **Prometheus** : Si VM indisponible mais Prometheus détecté → fallback
3. **Aucun** : Si aucun système détecté → pas d'onglet métriques

## Debug

En mode développement, un bandeau debug s'affiche indiquant :
- Type de monitoring utilisé
- Disponibilité Victoria Metrics
- Disponibilité Prometheus

## Compatibilité

- **Rancher** : >= 2.10.0
- **UI Extensions** : >= 3.0.0 < 4.0.0
- **Node.js** : >= 16