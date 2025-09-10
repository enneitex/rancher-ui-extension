<script>
import { mapGetters } from 'vuex';

export default {
  name: 'MiddlewareTypes',
  
  props: {
    row: {
      type:     Object,
      required: true
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    middlewareTypes() {
      const spec = this.row?.spec;
      
      if (!spec) {
        return [];
      }

      // Extraire tous les types de middlewares définis dans le spec
      return Object.keys(spec);
    },

    formattedTypes() {
      if (this.middlewareTypes.length === 0) {
        return this.t('generic.none');
      }
      
      return this.middlewareTypes.join(', ');
    },

    typeCount() {
      return this.middlewareTypes.length;
    },

  }
};
</script>

<template>
  <span class="middleware-types">
    <span
      v-if="typeCount === 0"
      class="text-muted"
    >
      {{ formattedTypes }}
    </span>
    <span v-else>
      {{ formattedTypes }}
    </span>
  </span>
</template>

<style lang="scss" scoped>
.middleware-types {
  .text-muted {
    color: var(--muted);
    font-style: italic;
  }
}
</style>