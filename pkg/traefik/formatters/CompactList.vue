<script>
import { mapGetters } from 'vuex';

export default {
  name: 'CompactList',
  
  props: {
    value: {
      type:    [Array, String],
      default: () => []
    },

    row: {
      type:    Object,
      default: () => ({})
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    items() {
      if (!this.value) {
        return [];
      }
      
      if (Array.isArray(this.value)) {
        return this.value;
      }
      
      // Si c'est une string, essayer de la parser comme JSON ou la séparer par des virgules
      if (typeof this.value === 'string') {
        try {
          const parsed = JSON.parse(this.value);
          return Array.isArray(parsed) ? parsed : [this.value];
        } catch (e) {
          // Si ce n'est pas du JSON valide, séparer par des virgules
          return this.value.split(',').map(item => item.trim()).filter(item => item);
        }
      }
      
      return [this.value];
    },

    mainItem() {
      return this.items.length > 0 ? this.items[0] : '';
    },

    remainingCount() {
      return Math.max(0, this.items.length - 1);
    },

    remainingItemsTooltip() {
      if (this.items.length <= 1) {
        return null;
      }

      let tooltip = '';
      this.items.forEach((item, i) => {
        tooltip += `&#8226; ${item}<br>`;
      });

      return tooltip;
    }
  }
};
</script>

<template>
  <span class="compact-list">
    <span
      v-if="mainItem"
      v-clean-tooltip.bottom="mainItem"
      class="main-item"
    >{{ mainItem }}</span>
    <span
      v-if="!mainItem"
      class="text-muted"
    >—</span>
    <br v-if="remainingCount > 0">
    <span
      v-if="remainingCount > 0"
      v-clean-tooltip.bottom="remainingItemsTooltip"
      class="plus-more"
    >{{ t('generic.plusMore', {n: remainingCount}) }}</span>
  </span>
</template>

<style lang="scss" scoped>
.compact-list {
  .main-item {
    word-break: break-all;
    line-height: 1.2;
  }

  .text-muted {
    color: var(--muted);
    font-style: italic;
  }
}
</style>