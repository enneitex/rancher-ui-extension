# VictoriaMetrics Monitoring Extension

Rancher UI extension that adds a **Monitoring** section in the left nav for clusters running
[victoria-metrics-k8s-stack](https://github.com/VictoriaMetrics/helm-charts/tree/master/charts/victoria-metrics-k8s-stack)
(vmks). Provides quick links to Grafana, VMAgent, VMAlert, and Alertmanager, plus list views
for ServiceMonitor and PodMonitor CRDs. Also adds VictoriaMetrics Grafana metric tabs on Pod,
Node, and Workload detail views.

**Requires:** `victoria-metrics-k8s-stack` installed on the cluster (CRD group `monitoring.coreos.com`).

> **Note:** The left-nav section appears on any cluster with `monitoring.coreos.com` CRDs — including
> plain kube-prometheus-stack installations. On those clusters all 4 link cards will be greyed
> (no VictoriaMetrics endpoints found). This extension specifically targets vmks users.

---

## ConfigMaps

The extension reads two optional ConfigMaps from the cluster. When absent, hardcoded defaults apply.

### `kube-monitoring/vmks-grafana` — Grafana service coordinates

Used by the Pod/Node/Workload metric tabs to locate the Grafana service.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vmks-grafana
  namespace: kube-monitoring
data:
  namespace: kube-monitoring     # namespace where Grafana is deployed
  service: vmks-grafana          # Grafana service name
  port: "8080"                   # Grafana service port
```

**Defaults (if ConfigMap absent):** `kube-monitoring / vmks-grafana / 8080`

### `kube-monitoring/vmks-monitoring` — Tool links and dashboard IDs

Used by the Monitoring overview page (links) and all metric tabs (dashboard IDs).

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vmks-monitoring
  namespace: kube-monitoring
data:
  # Tool links — Kubernetes proxy paths
  grafana.url: "/api/v1/namespaces/kube-monitoring/services/http:vmks-grafana:8080/proxy/"
  vmagent.url: "/api/v1/namespaces/kube-monitoring/services/http:vmks-vmagent:8429/proxy/targets"
  vmalert.url: "/api/v1/namespaces/kube-monitoring/services/http:vmks-vmalert:8080/proxy/"
  alertmanager.url: "/api/v1/namespaces/kube-monitoring/services/http:vmks-alertmanager:9093/proxy/"

  # Dashboard IDs (format: "{uid}/{slug}")
  pod.detailDashboardId: "rancher-pod-containers-1/rancher-pod-containers"
  pod.summaryDashboardId: "rancher-pod-1/rancher-pod"
  node.detailDashboardId: "rancher-node-detail-1/rancher-node-detail"
  node.summaryDashboardId: "rancher-node-1/rancher-node"
  workload.detailDashboardId: "rancher-workload-pods-1/rancher-workload-pods"
  workload.summaryDashboardId: "rancher-workload-1/rancher-workload"
```

**Defaults (if ConfigMap absent):** all link URLs empty (cards greyed), dashboard IDs fall back to
the values shown above.

#### Link availability

Each link card performs a live endpoint check on page load:
- The URL is parsed to extract namespace and service name.
- The Kubernetes `Endpoints` object for that service is fetched via `cluster/find`.
- Card is **available** (clickable) if the endpoint has at least one ready subset.
- Card is **greyed** in all other cases: empty URL, unparseable URL, endpoint not found,
  no ready subsets, or RBAC error on the find call.

---

## Building

```bash
# Build this extension
yarn build-pkg monitoring

# Serve locally
yarn serve-pkgs
```

**Breaking change from `victoria-metrics` extension:** The Helm chart artifact name changed from
`victoria-metrics` to `monitoring`. Operators upgrading from the old extension must uninstall
`victoria-metrics` and install `monitoring` separately. The published display name
(`catalog.cattle.io/display-name: VictoriaMetrics Monitoring`) is unchanged.
