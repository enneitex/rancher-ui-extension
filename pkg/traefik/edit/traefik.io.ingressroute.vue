<template>
  <div class="enhanced-ingressroute">
    <div class="header">
      <h2>🚀 Enhanced IngressRoute Editor</h2>
      <p class="subtitle">Improved UI for Traefik IngressRoute configuration</p>
    </div>

    <div class="form-section">
      <h3>Basic Information</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Name</label>
          <input 
            v-model="localValue.metadata.name"
            type="text" 
            placeholder="my-ingressroute"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>Namespace</label>
          <input 
            v-model="localValue.metadata.namespace"
            type="text" 
            placeholder="default"
            class="form-input"
          />
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>Routes Configuration</h3>
      <div v-for="(route, index) in routes" :key="index" class="route-card">
        <div class="card-header">
          <h4>Route {{ index + 1 }}</h4>
          <button 
            v-if="routes.length > 1"
            @click="removeRoute(index)" 
            class="btn-remove"
          >
            ✕
          </button>
        </div>
        
        <div class="form-row">
          <div class="form-group flex-2">
            <label>Match Rule</label>
            <input 
              v-model="route.match"
              type="text" 
              placeholder="Host(`example.com`)"
              class="form-input"
            />
            <small class="help-text">Example: Host(`example.com`) && Path(`/api`)</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Service Type</label>
            <select v-model="route.kind" class="form-select">
              <option value="Service">Service</option>
              <option value="TraefikService">TraefikService</option>
            </select>
          </div>
          <div class="form-group">
            <label>Service Name</label>
            <input 
              v-model="route.name"
              type="text" 
              placeholder="my-service"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Port</label>
            <input 
              v-model.number="route.port"
              type="number" 
              placeholder="80"
              class="form-input"
            />
          </div>
        </div>
      </div>
      
      <button @click="addRoute" class="btn-add">
        ➕ Add Route
      </button>
    </div>

    <div class="form-section">
      <h3>Entry Points</h3>
      <div class="checkbox-grid">
        <label v-for="ep in entryPointOptions" :key="ep.value" class="checkbox-item">
          <input 
            type="checkbox" 
            :value="ep.value"
            v-model="selectedEntryPoints"
          />
          <span>{{ ep.label }}</span>
        </label>
      </div>
    </div>

    <div class="form-section">
      <h3>TLS Configuration</h3>
      <div class="form-row">
        <label class="checkbox-item">
          <input type="checkbox" v-model="tlsEnabled" />
          <span>Enable TLS</span>
        </label>
      </div>
      
      <div v-if="tlsEnabled" class="form-row">
        <div class="form-group">
          <label>TLS Secret Name</label>
          <input 
            v-model="tlsSecretName"
            type="text" 
            placeholder="my-tls-secret"
            class="form-input"
          />
        </div>
      </div>
    </div>

    <div class="actions">
      <button @click="saveResource" class="btn-primary">💾 Save</button>
      <button @click="showYaml" class="btn-secondary">📝 View YAML</button>
    </div>

    <div v-if="yamlVisible" class="yaml-section">
      <h3>Generated YAML</h3>
      <pre class="yaml-output">{{ generatedYaml }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IngressRouteEdit',
  
  props: {
    value: {
      type: Object,
      required: true
    },
    mode: {
      type: String,
      default: 'edit'
    }
  },

  data() {
    return {
      yamlVisible: false,
      entryPointOptions: [
        { label: 'web (HTTP - 80)', value: 'web' },
        { label: 'websecure (HTTPS - 443)', value: 'websecure' },
        { label: 'traefik (Dashboard - 8080)', value: 'traefik' }
      ]
    };
  },

  computed: {
    localValue: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.$emit('input', newValue);
      }
    },

    routes: {
      get() {
        if (!this.localValue.spec) {
          this.ensureSpec();
        }
        return this.localValue.spec.routes || [];
      },
      set(newRoutes) {
        this.ensureSpec();
        this.$set(this.localValue.spec, 'routes', newRoutes);
      }
    },

    selectedEntryPoints: {
      get() {
        this.ensureSpec();
        return this.localValue.spec.entryPoints || ['web'];
      },
      set(newEntryPoints) {
        this.ensureSpec();
        this.$set(this.localValue.spec, 'entryPoints', newEntryPoints);
      }
    },

    tlsEnabled: {
      get() {
        return !!(this.localValue.spec && this.localValue.spec.tls);
      },
      set(enabled) {
        this.ensureSpec();
        if (enabled) {
          this.$set(this.localValue.spec, 'tls', {
            secretName: ''
          });
        } else {
          this.$delete(this.localValue.spec, 'tls');
        }
      }
    },

    tlsSecretName: {
      get() {
        return this.localValue.spec?.tls?.secretName || '';
      },
      set(secretName) {
        if (this.localValue.spec?.tls) {
          this.$set(this.localValue.spec.tls, 'secretName', secretName);
        }
      }
    },

    generatedYaml() {
      try {
        return JSON.stringify(this.localValue, null, 2);
      } catch (e) {
        return 'Error generating YAML';
      }
    }
  },

  mounted() {
    this.initializeDefaults();
  },

  methods: {
    ensureSpec() {
      if (!this.localValue.spec) {
        this.$set(this.localValue, 'spec', {});
      }
    },

    initializeDefaults() {
      // Ensure metadata exists
      if (!this.localValue.metadata) {
        this.$set(this.localValue, 'metadata', {
          name: '',
          namespace: 'default'
        });
      }

      // Ensure spec exists
      this.ensureSpec();

      // Initialize with default route if none exist
      if (!this.localValue.spec.routes || this.localValue.spec.routes.length === 0) {
        this.$set(this.localValue.spec, 'routes', [{
          match: 'Host(`example.com`)',
          kind: 'Service',
          name: '',
          port: 80
        }]);
      }

      // Initialize entryPoints if not set
      if (!this.localValue.spec.entryPoints) {
        this.$set(this.localValue.spec, 'entryPoints', ['web']);
      }
    },

    addRoute() {
      const newRoute = {
        match: 'Host(`example.com`)',
        kind: 'Service',
        name: '',
        port: 80
      };
      this.routes = [...this.routes, newRoute];
    },

    removeRoute(index) {
      const updatedRoutes = [...this.routes];
      updatedRoutes.splice(index, 1);
      this.routes = updatedRoutes;
    },

    saveResource() {
      // Clean up empty values
      if (this.localValue.spec.routes) {
        this.localValue.spec.routes = this.localValue.spec.routes.filter(route => 
          route.match && route.name
        );
      }

      this.$emit('input', this.localValue);
      
      // Show success message
      alert('✅ IngressRoute configuration saved successfully!');
    },

    showYaml() {
      this.yamlVisible = !this.yamlVisible;
    }
  }
};
</script>

<style scoped>
.enhanced-ingressroute {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e1e5e9;
}

.header h2 {
  color: #2c5aa0;
  margin-bottom: 5px;
}

.subtitle {
  color: #6c757d;
  margin: 0;
}

.form-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid #28a745;
}

.form-section h3 {
  color: #495057;
  margin-top: 0;
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  align-items: end;
}

.form-group {
  flex: 1;
}

.form-group.flex-2 {
  flex: 2;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #495057;
}

.form-input, .form-select {
  width: 100%;
  padding: 10px;
  border: 2px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.help-text {
  color: #6c757d;
  font-style: italic;
  margin-top: 2px;
  display: block;
}

.route-card {
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h4 {
  margin: 0;
  color: #007bff;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove:hover {
  background: #c82333;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.btn-add {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-add:hover {
  background: #218838;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 30px 0;
}

.btn-primary, .btn-secondary {
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.yaml-section {
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.yaml-output {
  background: #2d3748;
  color: #e2e8f0;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
  
  .actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-primary, .btn-secondary {
    width: 200px;
  }
}
</style>