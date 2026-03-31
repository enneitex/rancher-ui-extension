# VictoriaMetrics Monitoring Extension

Rancher UI extension that adds a **Monitoring** section in the left nav for clusters running
[victoria-metrics-k8s-stack](https://github.com/VictoriaMetrics/helm-charts/tree/master/charts/victoria-metrics-k8s-stack)
(vmks). Mirrors the native Rancher monitoring UX: Overview with Grafana/Alertmanager link cards
and AlertTable, a Monitors page (tabbed PodMonitor/ServiceMonitor), and an Alerting group
(AlertmanagerConfig, Routes & Receivers, PrometheusRules, Prometheuses).
Also adds VictoriaMetrics Grafana metric tabs on Pod, Node, and Workload detail views.

**Requires:** `victoria-metrics-k8s-stack` installed on the cluster (CRD group `operator.victoriametrics.com`).

> **Note:** The left-nav section appears on any cluster with `operator.victoriametrics.com` CRDs.
> Without the `vmks-monitoring` ConfigMap the Overview and metric tabs show an info banner
> instead of link cards.

---

## ConfigMap

The extension reads a single ConfigMap from the cluster:

### `kube-monitoring/vmks-monitoring`

Used by the Overview page (Grafana and Alertmanager link cards) and all metric tabs (dashboard IDs).
**If absent, the extension nav still appears but the Overview and tabs show a "ConfigMap not found" banner.**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vmks-monitoring
  namespace: kube-monitoring
data:
  # Grafana service coordinates
  grafana.namespace: kube-monitoring
  grafana.service: vmks-grafana
  grafana.port: "8080"

  # Alertmanager service coordinates
  alertmanager.namespace: kube-monitoring
  alertmanager.service: vmalertmanager-vmks-victoria-metrics-k8s-stack
  alertmanager.port: "9093"

  # Dashboard IDs (format: "{uid}/{slug}") — optional, defaults shown
  pod.detailDashboardId: "rancher-pod-containers-1/rancher-pod-containers"
  pod.summaryDashboardId: "rancher-pod-1/rancher-pod"
  node.detailDashboardId: "rancher-node-detail-1/rancher-node-detail"
  node.summaryDashboardId: "rancher-node-1/rancher-node"
  workload.detailDashboardId: "rancher-workload-pods-1/rancher-workload-pods"
  workload.summaryDashboardId: "rancher-workload-1/rancher-workload"
```

The `grafana.*` and `alertmanager.*` keys are required for the Overview link cards to render.
Dashboard ID keys are optional — the defaults shown above are used when absent.

---

## RBAC

The extension reads the ConfigMap via the Rancher API. On RBAC-restricted clusters, the
Rancher service account must have `get` on `configmaps` in `kube-monitoring`:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: monitoring-extension
  namespace: kube-monitoring
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    resourceNames: ["vmks-monitoring"]
    verbs: ["get", "watch"]
```

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
