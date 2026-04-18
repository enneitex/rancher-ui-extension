<script>
import AlertTable from '@shell/components/AlertTable';
import LazyImage from '@shell/components/LazyImage';
import SimpleBox from '@shell/components/SimpleBox';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import { loadVMConfigFromCluster } from '../utils/victoria-metrics';

const grafanaSrc      = require('~shell/assets/images/vendor/grafana.svg');
const alertmanagerSrc = require('~shell/assets/images/vendor/prometheus.svg');

export default {
  components: {
    AlertTable,
    Banner,
    LazyImage,
    Loading,
    SimpleBox,
  },

  async fetch() {
    const currentCluster = this.$store.getters['currentCluster'];
    const clusterPrefix  = currentCluster.id === 'local'
      ? ''
      : `/k8s/clusters/${ currentCluster.id }`;

    const config = await loadVMConfigFromCluster(this.$store);

    if (!config) {
      this.configMissing = true;
      return;
    }

    this.alertmanagerNamespace = config.alertmanager.namespace;
    this.alertmanagerService   = config.alertmanager.service;

    this.externalLinks = [
      {
        iconSrc:     grafanaSrc,
        label:       'monitoring.overview.linkedList.grafana.label',
        description: 'monitoring.overview.linkedList.grafana.description',
        link:        `${ clusterPrefix }/api/v1/namespaces/${ config.namespace }/services/http:${ config.service }:${ config.port }/proxy/`,
      },
      {
        iconSrc:     alertmanagerSrc,
        label:       'monitoring.overview.linkedList.alertManager.label',
        description: 'monitoring.overview.linkedList.alertManager.description',
        link:        `${ clusterPrefix }/api/v1/namespaces/${ config.alertmanager.namespace }/services/http:${ config.alertmanager.service }:${ config.alertmanager.port }/proxy`,
      },
    ];
  },

  data() {
    return {
      configMissing:        false,
      externalLinks:        [],
      alertmanagerNamespace: null,
      alertmanagerService:   null,
    };
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <section v-else>
    <header class="row">
      <div class="col span-12">
        <h1>
          <t k="monitoring.overview.title" />
        </h1>
        <div>
          <t
            k="monitoring.overview.subtitle"
            :raw="true"
          />
        </div>
      </div>
    </header>
    <div>
      <Banner
        v-if="configMissing"
        color="warning"
        :label="t('monitoring.overview.configMissing')"
      />
      <div
        v-else
        class="create-resource-container"
      >
        <div class="subtypes-container">
          <a
            v-for="(fel, i) in externalLinks"
            :key="i"
            :href="fel.link"
            target="_blank"
            rel="noopener noreferrer"
            class="subtype-banner"
          >
            <div class="subtype-content">
              <div class="title">
                <div class="subtype-logo round-image">
                  <LazyImage :src="fel.iconSrc" />
                </div>
                <h5>
                  <span><t :k="fel.label" /></span>
                </h5>
                <div class="flex-right">
                  <i class="icon icon-external-link" />
                </div>
              </div>
              <hr role="none">
              <div class="description">
                <span><t :k="fel.description" /></span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
    <div>
      <SimpleBox
        class="mt-30"
        :title="t('monitoring.overview.alertsList.label')"
      >
        <AlertTable
          :monitoring-namespace="alertmanagerNamespace || undefined"
          :alert-service-endpoint="alertmanagerService || undefined"
        />
      </SimpleBox>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.create-resource-container .subtype-banner {
  min-height: 80px;
  padding: 10px;
}
</style>
