<script>
import { Banner } from '@components/Banner';
import { BadgeState } from '@components/BadgeState';
import { _VIEW } from '@shell/config/query-params';

export default {
  name: 'EntryPoints',

  components: {
    Banner,
    BadgeState
  },

  props: {
    value: {
      type: Object,
      required: true
    },
    mode: {
      type: String,
      default: 'view'
    }
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    entryPoints() {
      return this.value?.spec?.entryPoints || [];
    },

    hasEntryPoints() {
      return Array.isArray(this.entryPoints) && this.entryPoints.length > 0;
    },

    entryPointsDisplayText() {
      if (!this.hasEntryPoints) {
        return this.t('traefik.entryPoints.noEntryPoints');
      }
      return this.entryPoints.join(', ');
    }
  },

  methods: {
    t(key) {
      return this.$store.getters['i18n/t'](key);
    }
  }
};
</script>

<template>
  <div class="entry-points-section">
    <div class="row">
      <div class="col span-12">
        <div class="entry-points-row">
          <h4>{{ t('traefik.entryPoints.title') }}:</h4>
          <div v-if="hasEntryPoints" class="entry-points-list">
            <BadgeState
              v-for="entryPoint in entryPoints"
              :key="entryPoint"
              :label="entryPoint"
              color="bg-info"
              class="mr-10"
            />
          </div>
          <div v-else class="no-entry-points">
            <BadgeState
              :label="t('traefik.entryPoints.noEntryPoints')"
              color="bg-warning"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.entry-points-section {
  margin-bottom: 20px;
}

.entry-points-row {
  display: flex;
  align-items: center;
  gap: 15px;

  h4 {
    margin: 0;
  }
}

.entry-points-list {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.no-entry-points {
  display: flex;
}
</style>