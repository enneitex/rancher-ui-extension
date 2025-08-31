<template>
  <div v-if="middlewares && middlewares.length" class="middlewares-formatter">
    <div
      v-for="(middleware, i) in middlewares"
      :key="i"
      class="middleware-item"
    >
      <router-link
        v-if="middleware.targetLink"
        :to="middleware.targetLink"
        class="middleware-link"
      >
        {{ middleware.display }}
      </router-link>
      <span v-else class="middleware-name">
        {{ middleware.display }}
      </span>
    </div>
  </div>
  <span v-else class="text-muted">{{ t('generic.none') }}</span>
</template>

<script>
export default {
  name: 'MiddlewaresListFormatter',

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
    middlewares() {
      // Si value est un array avec les middlewares formatés avec liens, l'utiliser
      if (Array.isArray(this.value)) {
        return this.value.filter(mw => mw && mw !== '-');
      }
      
      // Sinon, utiliser middlewaresData depuis le row (avec liens)
      if (Array.isArray(this.row?.middlewaresData)) {
        return this.row.middlewaresData.filter(mw => mw && mw.display && mw.display !== '-');
      }

      // Fallback sur middlewares basiques (sans liens)
      if (Array.isArray(this.row?.middlewares)) {
        return this.row.middlewares.filter(mw => mw && mw !== '-').map(mw => ({
          display: mw,
          targetLink: null
        }));
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
.middlewares-formatter {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.middleware-item {
  display: flex;
  align-items: center;
}

.middleware-name {
  color: var(--body-text);
  text-decoration: none;
}

.middleware-link {
  color: var(--link);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
    color: var(--link-hover);
  }
}

.text-muted {
  color: var(--muted);
  font-style: italic;
}
</style>