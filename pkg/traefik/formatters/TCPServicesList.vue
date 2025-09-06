<script>
export default {
  name: 'TCPServicesList',
  
  props: {
    row: {
      type:     Object,
      required: true
    }
  },

  computed: {
    services() {
      const services = [];
      
      if (this.row.spec?.routes && Array.isArray(this.row.spec.routes)) {
        this.row.spec.routes.forEach(route => {
          if (route.services && Array.isArray(route.services)) {
            route.services.forEach(service => {
              if (service.name) {
                services.push({
                  name: service.name,
                  port: service.port,
                  namespace: service.namespace || this.row.metadata?.namespace,
                  weight: service.weight
                });
              }
            });
          }
        });
      }

      return services;
    },

    hasServices() {
      return this.services.length > 0;
    }
  }
};
</script>

<template>
  <div class="tcp-services-list">
    <div v-if="!hasServices" class="text-muted">
      {{ t('generic.none') }}
    </div>
    
    <div v-else class="services-container">
      <div 
        v-for="(service, idx) in services" 
        :key="`${service.namespace}-${service.name}-${idx}`"
        class="service-item"
      >
        <span class="service-name">{{ service.name }}</span>
        <span class="service-port">:{{ service.port }}</span>
        <span v-if="service.weight" class="service-weight">({{ service.weight }}%)</span>
        <span v-if="service.namespace !== row.metadata?.namespace" class="service-namespace">
          <i class="icon icon-folder" />
          {{ service.namespace }}
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tcp-services-list {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .services-container {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .service-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    
    .service-name {
      font-weight: 500;
      color: var(--primary);
    }

    .service-port {
      color: var(--text-secondary);
      font-family: monospace;
    }

    .service-weight {
      color: var(--text-muted);
      font-size: 0.9em;
    }

    .service-namespace {
      margin-left: 8px;
      color: var(--text-muted);
      font-size: 0.9em;
      
      .icon {
        font-size: 0.85em;
      }
    }
  }
}
</style>