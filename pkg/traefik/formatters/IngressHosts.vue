<template>
  <div v-if="rules && rules.length" class="ingress-hosts-formatter">
    <div
      v-for="rule in rules"
      :key="`${rule.host}-${rule.serviceName}-${rule.servicePort}`"
      class="host-rule"
    >
      <!-- Host with optional path -->
      <div class="host-part">
        <a
          v-if="rule.isUrl"
          :href="rule.fullPath"
          target="_blank"
          rel="noopener noreferrer"
          class="host-link"
        >
          {{ rule.displayPath }}
          <i class="icon" />
        </a>
        <span v-else class="host-text">
          {{ rule.displayPath }}
        </span>
      </div>

      <!-- Arrow and service link (only if serviceName exists) -->
      <div v-if="rule.serviceName" class="service-part">
        <span class="arrow">></span>
        <router-link
          v-if="rule.serviceTargetTo"
          :to="rule.serviceTargetTo"
          class="service-link"
        >
          {{ rule.serviceName }}
        </router-link>
        <span
          v-else
          class="service-text"
        >
          {{ rule.serviceName }}
        </span>
      </div>
    </div>
  </div>
  <span v-else class="text-muted">{{ t('generic.none') }}</span>
</template>

<script>
export default {
  name: 'IngressHostsFormatter',

  props: {
    value: {
      type:    [Object, String],
      default: null
    },
    row: {
      type:    Object,
      default: () => ({})
    }
  },

  computed: {
    rules() {
      // Si value est un objet avec des règles pré-calculées, l'utiliser
      if (this.value && Array.isArray(this.value)) {
        return this.value;
      }

      // Sinon, utiliser targetRoutes depuis le row (préparé par la vue liste)
      if (this.row?.targetRoutes) {
        return this.row.targetRoutes;
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
.ingress-hosts-formatter {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.host-rule {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  line-height: 1.2;
}

.host-part {
  display: flex;
  align-items: center;
  gap: 4px;
}

.host-link {
  color: var(--link);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 3px;

  &:hover {
    text-decoration: underline;
  }

  .icon {
    font-size: 0.8em;
    opacity: 0.7;
  }
}

.host-text {
  color: var(--body-text);
}

.service-part {
  display: flex;
  align-items: center;
  gap: 4px;
}

.arrow {
  color: var(--muted);
  font-weight: bold;
}

.service-link {
  color: var(--link);
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.service-text {
  color: var(--body-text);
  font-weight: 500;
}

.text-muted {
  color: var(--muted);
  font-style: italic;
}
</style>