<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import Loading from '@shell/components/Loading';
import { ENDPOINTS } from '@shell/config/types';
import {
  loadVMMonitoringConfig,
  extractNsSvcFromProxyUrl,
} from '../utils/victoria-metrics';

interface LinkState {
  key:             string;
  icon:            string;
  labelKey:        string;
  descriptionKey:  string;
  url:             string;
  available:       boolean;
}

const LINK_DEFS = [
  {
    key:            'grafana',
    icon:           'monitoring',
    labelKey:       'monitoring.overview.grafana.label',
    descriptionKey: 'monitoring.overview.grafana.description',
  },
  {
    key:            'vmagent',
    icon:           'upload',
    labelKey:       'monitoring.overview.vmagent.label',
    descriptionKey: 'monitoring.overview.vmagent.description',
  },
  {
    key:            'vmalert',
    icon:           'warning',
    labelKey:       'monitoring.overview.vmalert.label',
    descriptionKey: 'monitoring.overview.vmalert.description',
  },
  {
    key:            'alertmanager',
    icon:           'alert',
    labelKey:       'monitoring.overview.alertmanager.label',
    descriptionKey: 'monitoring.overview.alertmanager.description',
  },
];

const store   = useStore();
const pending = ref(true);
const links   = ref<LinkState[]>([]);

onMounted(async () => {
  const config = await loadVMMonitoringConfig(store);

  const results = await Promise.all(
    LINK_DEFS.map(async (def) => {
      const url = config.links[def.key as keyof typeof config.links] || '';

      if (!url) {
        return { ...def, url: '', available: false };
      }

      const parsed = extractNsSvcFromProxyUrl(url);
      if (!parsed) {
        return { ...def, url, available: false };
      }

      try {
        const endpoint = await store.dispatch('cluster/find', {
          type: ENDPOINTS,
          id:   `${parsed.namespace}/${parsed.service}`,
        });
        const available = !!(endpoint?.subsets?.length);
        return { ...def, url, available };
      } catch {
        return { ...def, url, available: false };
      }
    })
  );

  links.value   = results;
  pending.value = false;
});
</script>

<template>
  <Loading v-if="pending" />
  <section v-else>
    <header class="row">
      <div class="col span-12">
        <h1>
          <t k="monitoring.overview.title" />
        </h1>
      </div>
    </header>
    <div class="create-resource-container">
      <div class="subtypes-container">
        <a
          v-for="link in links"
          :key="link.key"
          v-clean-tooltip="!link.available ? t('monitoring.overview.linkNA') : undefined"
          :href="link.available ? link.url : undefined"
          :disabled="!link.available || undefined"
          target="_blank"
          rel="noopener noreferrer"
          :class="{ 'subtype-banner': true, disabled: !link.available }"
        >
          <div class="subtype-content">
            <div class="title">
              <div class="subtype-logo round-image">
                <i :class="`icon icon-${link.icon}`" />
              </div>
              <h5><span><t :k="link.labelKey" /></span></h5>
              <div class="flex-right">
                <i class="icon icon-external-link" />
              </div>
            </div>
            <hr role="none">
            <div class="description">
              <span><t :k="link.descriptionKey" /></span>
            </div>
          </div>
        </a>
      </div>
    </div>
  </section>
</template>
