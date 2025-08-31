<template>
  <a
    v-if="hostUrl"
    :href="hostUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="host-link"
    :title="`Ouvrir ${hostUrl}`"
  >
    {{ hostDisplay }}
    <i class="icon icon-external-link" />
  </a>
  <span v-else class="host-text">
    {{ hostDisplay || '-' }}
  </span>
</template>

<script>
export default {
  name: 'SimpleHostFormatter',

  props: {
    value: {
      type: String,
      default: ''
    },
    row: {
      type: Object,
      default: () => ({})
    }
  },

  computed: {
    hostDisplay() {
      return this.value || this.row?.hostDisplay || '-';
    },

    hostUrl() {
      // Si on a un host simple, construire l'URL
      if (this.hostDisplay && this.hostDisplay !== '-') {
        const hasWebsecure = this.row?.hasWebsecure || this.row?.tlsEnabled;
        const protocol = hasWebsecure ? 'https://' : 'http://';
        const path = this.row?.pathDisplay || '';
        
        return `${protocol}${this.hostDisplay}${path}`;
      }
      return null;
    }
  }
};
</script>

<style lang="scss" scoped>
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
</style>