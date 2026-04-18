import { MONITORING } from '@shell/config/types';
import { getAllReceivers, getAllRoutes } from '@shell/utils/alertmanagerconfig';

const {
  ALERTMANAGERCONFIG,
  PROMETHEUSRULE,
  SPOOFED: {
    RECEIVER, RECEIVER_SPEC, RECEIVER_EMAIL, RECEIVER_SLACK, RECEIVER_WEBHOOK,
    RECEIVER_PAGERDUTY, RECEIVER_OPSGENIE, RECEIVER_HTTP_CONFIG, RESPONDER,
    ROUTE, ROUTE_SPEC,
  },
} = MONITORING;

export function init($plugin, store) {
  const {
    product,
    basicType,
    configureType,
    mapType,
    spoofedType,
    virtualType,
  } = $plugin.DSL(store, 'monitoring');

  product({
    ifHaveGroup:         'operator.victoriametrics.com',
    icon:                'monitoring',
    weight:              89,
    label:               'Monitoring',
    showNamespaceFilter: true,
  });

  // ── Overview ────────────────────────────────────────────────────────────────
  virtualType({
    label:    'Monitoring',
    name:     'monitoring-overview',
    route:    { name: 'c-cluster-monitoring' },
    weight:   110,
    overview: true,
  });

  // ── Monitors (tabbed PodMonitor / ServiceMonitor) ───────────────────────────
  virtualType({
    label:  'Monitors',
    name:   'monitor',
    route:  { name: 'c-cluster-monitoring-monitor' },
    weight: 90,
  });

  configureType('monitor', { showListMasthead: false });

  // ── Spoofed types (Routes + Receivers from alertmanager secret) ─────────────
  spoofedType({
    label:   'Receivers',
    type:    RECEIVER,
    schemas: [
      {
        id:                RECEIVER,
        type:              'schema',
        collectionMethods: ['POST'],
        resourceFields:    { spec: { type: RECEIVER_SPEC } },
      },
      {
        id:             RECEIVER_SPEC,
        type:           'schema',
        resourceFields: {
          name:              { type: 'string' },
          email_configs:     { type: `array[${ RECEIVER_EMAIL }]` },
          slack_configs:     { type: `array[${ RECEIVER_SLACK }]` },
          pagerduty_configs: { type: `array[${ RECEIVER_PAGERDUTY }]` },
          opsgenie_configs:  { type: `array[${ RECEIVER_OPSGENIE }]` },
          webhook_configs:   { type: `array[${ RECEIVER_WEBHOOK }]` },
        },
      },
      {
        id:             RECEIVER_EMAIL,
        type:           'schema',
        resourceFields: {
          to:            { type: 'string' },
          send_resolved: { type: 'boolean' },
          from:          { type: 'string' },
          host:          { type: 'string' },
          port:          { type: 'string' },
          require_tls:   { type: 'boolean' },
          auth_username: { type: 'string' },
          auth_password: { type: 'string' },
        },
      },
      {
        id:             RECEIVER_SLACK,
        type:           'schema',
        resourceFields: {
          text:          { type: 'string' },
          api_url:       { type: 'string' },
          channel:       { type: 'string' },
          http_config:   { type: RECEIVER_HTTP_CONFIG },
          send_resolved: { type: 'boolean' },
        },
      },
      {
        id:             RECEIVER_PAGERDUTY,
        type:           'schema',
        resourceFields: {
          routing_key:   { type: 'string' },
          service_key:   { type: 'string' },
          http_config:   { type: RECEIVER_HTTP_CONFIG },
          send_resolved: { type: 'boolean' },
        },
      },
      {
        id:             RECEIVER_OPSGENIE,
        type:           'schema',
        resourceFields: {
          api_key:       { type: 'string' },
          http_config:   { type: RECEIVER_HTTP_CONFIG },
          send_resolved: { type: 'boolean' },
          responders:    { type: `array[${ RESPONDER }]` },
        },
      },
      {
        id:             RECEIVER_WEBHOOK,
        type:           'schema',
        resourceFields: {
          url:           { type: 'string' },
          http_config:   { type: RECEIVER_HTTP_CONFIG },
          send_resolved: { type: 'boolean' },
        },
      },
      {
        id:             RECEIVER_HTTP_CONFIG,
        type:           'schema',
        resourceFields: { proxy_url: { type: 'string' } },
      },
      {
        id:             RESPONDER,
        type:           'schema',
        resourceFields: {
          type:     { type: 'string' },
          id:       { type: 'string' },
          name:     { type: 'string' },
          username: { type: 'string' },
        },
      },
    ],
    getInstances: () => getAllReceivers(store.dispatch),
  });

  spoofedType({
    label:   'Routes',
    type:    ROUTE,
    schemas: [
      {
        id:                ROUTE,
        type:              'schema',
        collectionMethods: ['POST'],
        resourceFields:    { spec: { type: ROUTE_SPEC } },
      },
      {
        id:             ROUTE_SPEC,
        type:           'schema',
        resourceFields: {
          receiver:        { type: 'string' },
          group_by:        { type: 'array[string]' },
          group_wait:      { type: 'string' },
          group_interval:  { type: 'string' },
          repeat_interval: { type: 'string' },
          match:           { type: 'map[string]' },
          match_re:        { type: 'map[string]' },
        },
      },
    ],
    getInstances: () => getAllRoutes(store.dispatch),
  });

  // ── Routes & Receivers virtual page ────────────────────────────────────────
  virtualType({
    label:  'Routes and Receivers',
    name:   'route-receiver',
    route:  { name: 'c-cluster-monitoring-route-receiver' },
    weight: 1,
  });

  configureType('route-receiver', { showListMasthead: false });

  // ── Type labels ─────────────────────────────────────────────────────────────
  mapType('operator.victoriametrics.com.vmpodscrape',    store.getters['i18n/t']('monitoring.monitors.vmPodScrape.label'));
  mapType('operator.victoriametrics.com.vmservicescrape', store.getters['i18n/t']('monitoring.monitors.vmSvcScrape.label'));
  mapType('monitoring.coreos.com.probe',                  store.getters['i18n/t']('monitoring.monitors.probe.label'));

  // ── Nav groups ───────────────────────────────────────────────────────────────
  basicType([
    'monitoring-overview',
    'monitor',
  ]);

  basicType([
    ALERTMANAGERCONFIG,
    'route-receiver',
  ], 'Alerting');

  basicType([
    PROMETHEUSRULE,
  ], 'Advanced');
}
