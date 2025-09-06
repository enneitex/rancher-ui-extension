<template>
  <div v-if="primaryUrl" class="host-match-formatter">
    <a
      :href="primaryUrl.fullUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="host-link"
      :title="`Ouvrir ${primaryUrl.fullUrl}`"
    >
      {{ matchRule }}
      <i class="icon icon-external-link" />
    </a>
  </div>
  <span v-else class="host-text">{{ matchRule || '-' }}</span>
</template>

<script>
export default {
  name: 'HostMatchFormatter',

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
    matchRule() {
      return this.row?.match || this.value;
    },

    primaryUrl() {
      if (!this.matchRule) return null;

      // Extraire le premier host depuis la règle match
      const hostMatch = this.matchRule.match(/Host\(`([^`]+)`\)/);
      if (!hostMatch) return null;

      const firstHost = hostMatch[1].split(',')[0].trim(); // Prendre le premier host si multiple

      // Extraire le path optionnel
      const pathMatch = this.matchRule.match(/Path(?:Prefix)?\(`([^`]*)`\)/);
      const pathValue = pathMatch ? pathMatch[1] : '';

      // Déterminer le protocole
      const hasWebsecure = this.row?.hasWebsecure || this.hasTLS();
      const protocol = hasWebsecure ? 'https://' : 'http://';

      const fullUrl = `${protocol}${firstHost}${pathValue}`;

      return this.isValidUrl(fullUrl) ? { fullUrl } : null;
    }
  },

  methods: {
    hasTLS() {
      // Vérifier si l'IngressRoute a du TLS configuré
      return !!(this.row?.tlsEnabled ||
                (this.row?.resource && this.row.resource.spec?.tls));
    },

    isValidUrl(url) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },

    t(key) {
      return this.$store.getters['i18n/t'](key);
    }
  }
};
</script>

<style lang="scss" scoped>
.host-match-formatter {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.host-item {
  display: flex;
  align-items: center;
}

.host-link {
  color: var(--link);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
    color: var(--link-hover);
  }

  .icon {
    font-size: 0.8em;
    opacity: 0.7;
  }
}

.host-text {
  color: var(--body-text);
}

.text-muted {
  color: var(--muted);
  font-style: italic;
}
</style>