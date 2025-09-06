<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="fvFormIsValid"
    :errors="fvUnreportedValidationErrors"
    :description="t('traefik.middleware.description')"
    @error="e=>errors = e"
    @finish="save"
  >
    <div class="row">
      <div class="col span-12">
        <NameNsDescription
          :value="value"
          :mode="mode"
          :register-before-hook="registerBeforeHook"
          :rules="{
            name: fvGetAndReportPathRules('metadata.name'),
            namespace: fvGetAndReportPathRules('metadata.namespace'),
            description: []
          }"
        />
      </div>
    </div>

    <Tabbed :side-tabs="true">
      <!-- Configuration Tab -->
      <Tab
        name="config"
        :label="t('generic.configuration')"
        :weight="10"
        :error="tabErrors.config"
      >
        <div class="row">
          <div class="col span-12">
            <Banner
              color="info"
              :label="t('traefik.middleware.description')"
            />
          </div>
        </div>

        <!-- Middleware Type Selection -->
        <div class="row">
          <div class="col span-12">
            <LabeledSelect
              v-model="middlewareType"
              :mode="mode"
              :label="t('traefik.middleware.type.label')"
              :options="middlewareTypeOptions"
              :rules="fvGetAndReportPathRules('spec')"
            />
          </div>
        </div>

        <!-- Dynamic Configuration based on Type -->
        <div v-if="middlewareType" class="middleware-config">
          <!-- Add Headers Middleware -->
          <div v-if="middlewareType === 'addHeaders'" class="config-section">
            <h4>{{ t('traefik.middleware.type.addHeaders') }}</h4>
            <div class="row">
              <div class="col span-12">
                <KeyValue
                  v-model="value.spec.addHeaders.request.headers"
                  :mode="mode"
                  :title="t('generic.headers')"
                  :initial-empty-row="true"
                  :read-allowed="false"
                  :key-label="t('generic.key')"
                  :value-label="t('generic.value')"
                />
              </div>
            </div>
          </div>

          <!-- Basic Auth Middleware -->
          <div v-else-if="middlewareType === 'basicAuth'" class="config-section">
            <h4>{{ t('traefik.middleware.type.basicAuth') }}</h4>
            <div class="row">
              <div class="col span-6">
                <LabeledInput
                  v-model="value.spec.basicAuth.secret"
                  :mode="mode"
                  :label="t('generic.secret')"
                  :rules="fvGetAndReportPathRules('spec.basicAuth.secret')"
                />
              </div>
              <div class="col span-6">
                <LabeledInput
                  v-model="value.spec.basicAuth.realm"
                  :mode="mode"
                  :label="t('generic.realm')"
                />
              </div>
            </div>
            <div class="row">
              <div class="col span-12">
                <Checkbox
                  v-model="value.spec.basicAuth.removeHeader"
                  :mode="mode"
                  :label="t('generic.removeHeader')"
                />
              </div>
            </div>
          </div>

          <!-- Compress Middleware -->
          <div v-else-if="middlewareType === 'compress'" class="config-section">
            <h4>{{ t('traefik.middleware.type.compress') }}</h4>
            <div class="row">
              <div class="col span-6">
                <LabeledInput
                  v-model="value.spec.compress.excludedContentTypes"
                  :mode="mode"
                  :label="t('generic.excludedContentTypes')"
                  placeholder="text/html,application/json"
                />
              </div>
              <div class="col span-6">
                <LabeledInput
                  v-model.number="value.spec.compress.minResponseBodyBytes"
                  :mode="mode"
                  type="number"
                  :label="t('generic.minResponseBodyBytes')"
                  placeholder="1024"
                />
              </div>
            </div>
          </div>

          <!-- Headers Middleware -->
          <div v-else-if="middlewareType === 'headers'" class="config-section">
            <h4>{{ t('traefik.middleware.type.headers') }}</h4>

            <!-- Custom Request Headers -->
            <div class="headers-subsection">
              <h5>Custom Request Headers</h5>
              <KeyValue
                v-model="value.spec.headers.customRequestHeaders"
                :mode="mode"
                :title="t('generic.customRequestHeaders')"
                :initial-empty-row="true"
                :read-allowed="false"
                :key-label="t('generic.key')"
                :value-label="t('generic.value')"
              />
            </div>

            <!-- Custom Response Headers -->
            <div class="headers-subsection">
              <h5>Custom Response Headers</h5>
              <KeyValue
                v-model="value.spec.headers.customResponseHeaders"
                :mode="mode"
                :title="t('generic.customResponseHeaders')"
                :initial-empty-row="true"
                :read-allowed="false"
                :key-label="t('generic.key')"
                :value-label="t('generic.value')"
              />
            </div>

            <!-- Security Headers -->
            <div class="headers-subsection">
              <h5>Security Headers</h5>
              <div class="row">
                <div class="col span-6">
                  <Checkbox
                    v-model="value.spec.headers.sslRedirect"
                    :mode="mode"
                    :label="t('generic.sslRedirect')"
                  />
                </div>
                <div class="col span-6">
                  <Checkbox
                    v-model="value.spec.headers.stsIncludeSubdomains"
                    :mode="mode"
                    :label="t('generic.stsIncludeSubdomains')"
                  />
                </div>
              </div>
              <div class="row">
                <div class="col span-6">
                  <LabeledInput
                    v-model.number="value.spec.headers.stsSeconds"
                    :mode="mode"
                    type="number"
                    :label="t('generic.stsSeconds')"
                    placeholder="31536000"
                  />
                </div>
                <div class="col span-6">
                  <LabeledInput
                    v-model="value.spec.headers.contentTypeNosniff"
                    :mode="mode"
                    :label="t('generic.contentTypeNosniff')"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Rate Limit Middleware -->
          <div v-else-if="middlewareType === 'rateLimit'" class="config-section">
            <h4>{{ t('traefik.middleware.type.rateLimit') }}</h4>
            <div class="row">
              <div class="col span-4">
                <LabeledInput
                  v-model.number="value.spec.rateLimit.average"
                  :mode="mode"
                  type="number"
                  :label="t('generic.average')"
                  placeholder="100"
                  :rules="fvGetAndReportPathRules('spec.rateLimit.average')"
                />
              </div>
              <div class="col span-4">
                <LabeledInput
                  v-model.number="value.spec.rateLimit.burst"
                  :mode="mode"
                  type="number"
                  :label="t('generic.burst')"
                  placeholder="50"
                />
              </div>
              <div class="col span-4">
                <LabeledInput
                  v-model="value.spec.rateLimit.period"
                  :mode="mode"
                  :label="t('generic.period')"
                  placeholder="1m"
                />
              </div>
            </div>
          </div>

          <!-- Redirect Scheme Middleware -->
          <div v-else-if="middlewareType === 'redirectScheme'" class="config-section">
            <h4>{{ t('traefik.middleware.type.redirectScheme') }}</h4>
            <div class="row">
              <div class="col span-6">
                <LabeledSelect
                  v-model="value.spec.redirectScheme.scheme"
                  :mode="mode"
                  :label="t('generic.scheme')"
                  :options="schemeOptions"
                  :rules="fvGetAndReportPathRules('spec.redirectScheme.scheme')"
                />
              </div>
              <div class="col span-6">
                <LabeledInput
                  v-model="value.spec.redirectScheme.port"
                  :mode="mode"
                  :label="t('generic.port')"
                  placeholder="443"
                />
              </div>
            </div>
            <div class="row">
              <div class="col span-12">
                <Checkbox
                  v-model="value.spec.redirectScheme.permanent"
                  :mode="mode"
                  :label="t('generic.permanent')"
                />
              </div>
            </div>
          </div>

          <!-- Strip Prefix Middleware -->
          <div v-else-if="middlewareType === 'stripPrefix'" class="config-section">
            <h4>{{ t('traefik.middleware.type.stripPrefix') }}</h4>
            <div class="row">
              <div class="col span-12">
                <ArrayList
                  v-model="value.spec.stripPrefix.prefixes"
                  :mode="mode"
                  :title="t('generic.prefixes')"
                  :initial-empty-row="true"
                  :rules="fvGetAndReportPathRules('spec.stripPrefix.prefixes')"
                />
              </div>
            </div>
            <div class="row">
              <div class="col span-12">
                <Checkbox
                  v-model="value.spec.stripPrefix.forceSlash"
                  :mode="mode"
                  :label="t('generic.forceSlash')"
                />
              </div>
            </div>
          </div>

          <!-- Generic YAML Configuration -->
          <div v-else class="config-section">
            <h4>{{ selectedMiddlewareLabel }} Configuration</h4>
            <div class="row">
              <div class="col span-12">
                <YamlEditor
                  ref="yaml"
                  v-model="middlewareSpec"
                  :scrolling="false"
                  :initial-yaml-values="middlewareSpec"
                  :edit-first-object="true"
                />
              </div>
            </div>
          </div>
        </div>
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { Banner } from '@components/Banner';
import KeyValue from '@shell/components/form/KeyValue';
import ArrayList from '@shell/components/form/ArrayList';
import YamlEditor from '@shell/components/YamlEditor';
import { get, set } from '@shell/utils/object';

export default {
  name: 'MiddlewareEdit',

  components: {
    CruResource,
    NameNsDescription,
    Tabbed,
    Tab,
    LabeledInput,
    LabeledSelect,
    Checkbox,
    Banner,
    KeyValue,
    ArrayList,
    YamlEditor
  },

  mixins: [CreateEditView, FormValidation],

  data() {
    return {
      middlewareType: '',
      fvFormRuleSets: [
        {
          path: 'metadata.name',
          rules: ['required'],
          translationKey: 'nameNsDescription.name.label'
        },
        {
          path: 'spec',
          rules: ['required'],
          translationKey: 'traefik.middleware.spec.label'
        }
      ]
    };
  },

  computed: {
    // Override doneParams to exclude 'product' parameter
    doneParams() {
      return {
        cluster: this.$route.params.cluster,
        resource: this.$route.params.resource || this.value.type
      };
    },

    middlewareTypeOptions() {
      return [
        { label: this.t('traefik.middleware.type.addHeaders'), value: 'addHeaders' },
        { label: this.t('traefik.middleware.type.basicAuth'), value: 'basicAuth' },
        { label: this.t('traefik.middleware.type.compress'), value: 'compress' },
        { label: this.t('traefik.middleware.type.headers'), value: 'headers' },
        { label: this.t('traefik.middleware.type.rateLimit'), value: 'rateLimit' },
        { label: this.t('traefik.middleware.type.redirectScheme'), value: 'redirectScheme' },
        { label: this.t('traefik.middleware.type.stripPrefix'), value: 'stripPrefix' },
        { label: this.t('traefik.middleware.type.retry'), value: 'retry' },
        { label: this.t('traefik.middleware.type.circuitBreaker'), value: 'circuitBreaker' },
        { label: this.t('traefik.middleware.type.errors'), value: 'errors' },
        { label: this.t('traefik.middleware.type.forwardAuth'), value: 'forwardAuth' },
        { label: this.t('traefik.middleware.type.ipWhiteList'), value: 'ipWhiteList' },
        { label: this.t('traefik.middleware.type.redirectRegex'), value: 'redirectRegex' },
        { label: this.t('traefik.middleware.type.replacePath'), value: 'replacePath' },
        { label: this.t('traefik.middleware.type.replacePathRegex'), value: 'replacePathRegex' },
        { label: this.t('traefik.middleware.type.stripPrefixRegex'), value: 'stripPrefixRegex' }
      ];
    },

    schemeOptions() {
      return [
        { label: 'HTTPS', value: 'https' },
        { label: 'HTTP', value: 'http' }
      ];
    },

    selectedMiddlewareLabel() {
      const option = this.middlewareTypeOptions.find(opt => opt.value === this.middlewareType);
      return option ? option.label : 'Configuration';
    },

    middlewareSpec: {
      get() {
        return get(this.value, 'spec') || {};
      },
      set(value) {
        set(this.value, 'spec', value);
      }
    },

    tabErrors() {
      return {
        config: !!this.fvGetPathErrors(['spec'])?.length
      };
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
    this.initializeDefaults();
    this.detectMiddlewareType();
  },

  methods: {
    initializeDefaults() {
      if (!this.value.spec) {
        this.$set(this.value, 'spec', {});
      }
    },

    detectMiddlewareType() {
      // Detect existing middleware type from spec
      if (this.value.spec) {
        const specKeys = Object.keys(this.value.spec);
        if (specKeys.length > 0) {
          const detectedType = specKeys[0];
          if (this.middlewareTypeOptions.find(opt => opt.value === detectedType)) {
            this.middlewareType = detectedType;
          }
        }
      }
    },

    willSave() {
      // Clean up spec based on selected type
      if (this.middlewareType) {
        // Remove all other middleware configurations
        const newSpec = {};
        if (this.value.spec[this.middlewareType]) {
          newSpec[this.middlewareType] = this.value.spec[this.middlewareType];
        } else {
          // Initialize empty config for new middleware type
          newSpec[this.middlewareType] = {};
        }
        this.value.spec = newSpec;
      }
    },

    initializeMiddlewareConfig() {
      if (!this.middlewareType) return;

      if (!this.value.spec[this.middlewareType]) {
        this.$set(this.value.spec, this.middlewareType, {});

        // Set default values based on middleware type
        switch (this.middlewareType) {
          case 'addHeaders':
            this.$set(this.value.spec.addHeaders, 'request', { headers: {} });
            break;
          case 'basicAuth':
            this.$set(this.value.spec.basicAuth, 'secret', '');
            break;
          case 'headers':
            this.$set(this.value.spec.headers, 'customRequestHeaders', {});
            this.$set(this.value.spec.headers, 'customResponseHeaders', {});
            break;
          case 'rateLimit':
            this.$set(this.value.spec.rateLimit, 'average', 100);
            this.$set(this.value.spec.rateLimit, 'period', '1m');
            break;
          case 'redirectScheme':
            this.$set(this.value.spec.redirectScheme, 'scheme', 'https');
            break;
          case 'stripPrefix':
            this.$set(this.value.spec.stripPrefix, 'prefixes', []);
            break;
        }
      }
    }
  },

  watch: {
    middlewareType: {
      handler(newType) {
        if (newType) {
          this.initializeMiddlewareConfig();
        }
      },
      immediate: false
    }
  }
};
</script>

<style lang="scss" scoped>
.middleware-config {
  margin-top: 20px;
}

.config-section {
  background: var(--box-bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 20px;
  margin-top: 20px;

  h4 {
    color: var(--primary);
    margin-top: 0;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }
}

.headers-subsection {
  margin-bottom: 25px;

  h5 {
    color: var(--input-label);
    margin-bottom: 15px;
    font-size: 1em;
    font-weight: 600;
  }

  &:last-child {
    margin-bottom: 0;
  }
}
</style>