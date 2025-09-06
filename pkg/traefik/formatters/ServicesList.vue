<template>
  <div v-if="services && services.length" class="services-formatter">
    <div
      v-for="(service, i) in services"
      :key="i"
      class="service-item"
    >
      <router-link
        v-if="service.targetLink"
        :to="service.targetLink"
        class="service-link"
      >
        {{ service.display }}
      </router-link>
      <span v-else class="service-name">
        {{ service.display }}
      </span>
    </div>
  </div>
  <span v-else class="text-muted">{{ t('generic.none') }}</span>
</template>

<script>
export default {
  name: 'ServicesListFormatter',

  props: {
    value: {
      type: [Array, String],
      default: null
    },
    row: {
      type: Object,
      default: () => ({})
    }
  },

  computed: {
    services() {
      // Si value est un array avec les services formatés, l'utiliser
      if (Array.isArray(this.value)) {
        return this.value;
      }

      // Sinon, utiliser servicesData depuis le row
      if (this.row?.servicesData) {
        return this.row.servicesData;
      }

      return [];
    }
  },

  methods: {
    t(key) {
      return this.$store.getters['i18n/t'](key);
    }
  }
};
</script>

<style lang="scss" scoped>
.services-formatter {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.service-item {
  display: flex;
  align-items: center;
}

.service-link {
  color: var(--link);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    color: var(--link-hover);
  }
}

.service-name {
  color: var(--body-text);
}

.text-muted {
  color: var(--muted);
  font-style: italic;
}
</style>