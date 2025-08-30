<template>
  <div class="traefik-dashboard">
    <!-- Header Section -->
    <div class="header">
      <div class="header-content">
        <div class="title-section">
          <div class="icon">
            <i class="icon icon-globe"></i>
          </div>
          <div class="title-text">
            <h1>Traefik Proxy</h1>
            <p class="subtitle">Modern HTTP reverse proxy and load balancer</p>
          </div>
        </div>
        <div class="version-info">
          <div class="status-badge active">
            <i class="icon icon-checkmark"></i>
            Active
          </div>
        </div>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="overview-section">
      <div class="cards-grid">
        <div class="overview-card">
          <div class="card-icon ingressroutes">
            <i class="icon icon-network"></i>
          </div>
          <div class="card-content">
            <h3>{{ ingressRoutesCount }}</h3>
            <p>IngressRoutes</p>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon middlewares">
            <i class="icon icon-filter"></i>
          </div>
          <div class="card-content">
            <h3>{{ middlewaresCount }}</h3>
            <p>Middlewares</p>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon services">
            <i class="icon icon-service"></i>
          </div>
          <div class="card-content">
            <h3>{{ servicesCount }}</h3>
            <p>TraefikServices</p>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon tls">
            <i class="icon icon-lock"></i>
          </div>
          <div class="card-content">
            <h3>{{ tlsOptionsCount }}</h3>
            <p>TLS Options</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2>Quick Actions</h2>
      <div class="actions-grid">
        <n-link :to="createIngressRouteLink" class="action-card">
          <div class="action-icon">
            <i class="icon icon-plus"></i>
          </div>
          <div class="action-content">
            <h3>Create IngressRoute</h3>
            <p>Route HTTP traffic to your services</p>
          </div>
        </n-link>
        
        <n-link :to="createMiddlewareLink" class="action-card">
          <div class="action-icon">
            <i class="icon icon-plus"></i>
          </div>
          <div class="action-content">
            <h3>Create Middleware</h3>
            <p>Add request/response processing</p>
          </div>
        </n-link>
        
        <n-link :to="createTLSOptionLink" class="action-card">
          <div class="action-icon">
            <i class="icon icon-plus"></i>
          </div>
          <div class="action-content">
            <h3>Create TLS Option</h3>
            <p>Configure SSL/TLS settings</p>
          </div>
        </n-link>
      </div>
    </div>

    <!-- Resources Navigation -->
    <div class="resources-navigation">
      <h2>Traefik Resources</h2>
      <div class="resources-grid">
        <n-link 
          v-for="resource in traefikResources" 
          :key="resource.type"
          :to="resource.link" 
          class="resource-card"
        >
          <div class="resource-icon">
            <i :class="resource.icon"></i>
          </div>
          <div class="resource-content">
            <h3>{{ resource.name }}</h3>
            <p>{{ resource.description }}</p>
            <div class="resource-count">{{ resource.count }} items</div>
          </div>
          <div class="resource-arrow">
            <i class="icon icon-chevron-right"></i>
          </div>
        </n-link>
      </div>
    </div>

    <!-- Getting Started -->
    <div class="getting-started">
      <h2>Getting Started with Traefik</h2>
      <div class="help-cards">
        <div class="help-card">
          <h3>📖 Documentation</h3>
          <p>Learn about Traefik concepts and configuration</p>
          <a href="https://doc.traefik.io/traefik/" target="_blank" class="help-link">
            View Documentation
            <i class="icon icon-external-link"></i>
          </a>
        </div>
        
        <div class="help-card">
          <h3>🚀 Quick Start</h3>
          <p>Get started with basic routing and middleware setup</p>
          <a href="#" @click.prevent="showQuickStart" class="help-link">
            View Guide
            <i class="icon icon-chevron-right"></i>
          </a>
        </div>
        
        <div class="help-card">
          <h3>💡 Examples</h3>
          <p>Explore common Traefik configuration patterns</p>
          <a href="https://github.com/traefik/traefik/tree/master/docs/content/user-guides" target="_blank" class="help-link">
            Browse Examples
            <i class="icon icon-external-link"></i>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TraefikDashboard',
  
  data() {
    return {
      // Mock data - in real implementation, fetch from API
      ingressRoutesCount: 12,
      middlewaresCount: 8,
      servicesCount: 4,
      tlsOptionsCount: 2
    };
  },

  computed: {
    currentCluster() {
      return this.$route.params.cluster;
    },

    createIngressRouteLink() {
      return {
        name: 'c-cluster-traefik-resource-create',
        params: {
          cluster: this.currentCluster,
          resource: 'traefik.io.ingressroute'
        }
      };
    },

    createMiddlewareLink() {
      return {
        name: 'c-cluster-traefik-resource-create',
        params: {
          cluster: this.currentCluster,
          resource: 'traefik.io.middleware'
        }
      };
    },

    createTLSOptionLink() {
      return {
        name: 'c-cluster-traefik-resource-create',
        params: {
          cluster: this.currentCluster,
          resource: 'traefik.io.tlsoption'
        }
      };
    },

    traefikResources() {
      return [
        {
          type: 'traefik.io.ingressroute',
          name: 'IngressRoutes',
          description: 'HTTP routing rules to your services',
          icon: 'icon icon-network',
          count: this.ingressRoutesCount,
          link: {
            name: 'c-cluster-traefik-resource',
            params: {
              cluster: this.currentCluster,
              resource: 'traefik.io.ingressroute'
            }
          }
        },
        {
          type: 'traefik.io.ingressroutetcp',
          name: 'IngressRoutes TCP',
          description: 'TCP routing rules',
          icon: 'icon icon-network',
          count: 3,
          link: {
            name: 'c-cluster-traefik-resource',
            params: {
              cluster: this.currentCluster,
              resource: 'traefik.io.ingressroutetcp'
            }
          }
        },
        {
          type: 'traefik.io.ingressrouteudp',
          name: 'IngressRoutes UDP',
          description: 'UDP routing rules',
          icon: 'icon icon-network',
          count: 1,
          link: {
            name: 'c-cluster-traefik-resource',
            params: {
              cluster: this.currentCluster,
              resource: 'traefik.io.ingressrouteudp'
            }
          }
        },
        {
          type: 'traefik.io.middleware',
          name: 'Middlewares',
          description: 'Request and response processing',
          icon: 'icon icon-filter',
          count: this.middlewaresCount,
          link: {
            name: 'c-cluster-traefik-resource',
            params: {
              cluster: this.currentCluster,
              resource: 'traefik.io.middleware'
            }
          }
        },
        {
          type: 'traefik.io.middlewaretcp',
          name: 'TCP Middlewares',
          description: 'TCP-specific middleware',
          icon: 'icon icon-filter',
          count: 2,
          link: {
            name: 'c-cluster-traefik-resource',
            params: {
              cluster: this.currentCluster,
              resource: 'traefik.io.middlewaretcp'
            }
          }
        },
        {
          type: 'traefik.io.tlsoption',
          name: 'TLS Options',
          description: 'SSL/TLS configuration options',
          icon: 'icon icon-lock',
          count: this.tlsOptionsCount,
          link: {
            name: 'c-cluster-traefik-resource',
            params: {
              cluster: this.currentCluster,
              resource: 'traefik.io.tlsoption'
            }
          }
        },
        {
          type: 'traefik.io.tlsstore',
          name: 'TLS Stores',
          description: 'TLS certificate stores',
          icon: 'icon icon-folder',
          count: 1,
          link: {
            name: 'c-cluster-traefik-resource',
            params: {
              cluster: this.currentCluster,
              resource: 'traefik.io.tlsstore'
            }
          }
        },
        {
          type: 'traefik.io.traefikservice',
          name: 'TraefikServices',
          description: 'Load balancing and service configuration',
          icon: 'icon icon-service',
          count: this.servicesCount,
          link: {
            name: 'c-cluster-traefik-resource',
            params: {
              cluster: this.currentCluster,
              resource: 'traefik.io.traefikservice'
            }
          }
        },
        {
          type: 'traefik.io.serverstransport',
          name: 'ServersTransport',
          description: 'Backend server transport configuration',
          icon: 'icon icon-arrow-right',
          count: 2,
          link: {
            name: 'c-cluster-traefik-resource',
            params: {
              cluster: this.currentCluster,
              resource: 'traefik.io.serverstransport'
            }
          }
        }
      ];
    }
  },

  methods: {
    showQuickStart() {
      // TODO: Show quick start modal or navigate to guide
      alert('Quick start guide would be shown here');
    }
  }
};
</script>

<style lang="scss" scoped>
.traefik-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  // Header
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 20px;

      .icon {
        font-size: 48px;
        opacity: 0.9;
      }

      h1 {
        font-size: 2.5rem;
        margin: 0;
        font-weight: 300;
      }

      .subtitle {
        margin: 5px 0 0 0;
        opacity: 0.8;
        font-size: 1.1rem;
      }
    }

    .status-badge {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      backdrop-filter: blur(10px);

      &.active {
        color: #4ade80;
      }
    }
  }

  // Overview Cards
  .overview-section {
    margin-bottom: 40px;

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .overview-card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      display: flex;
      align-items: center;
      gap: 20px;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }

      .card-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;

        &.ingressroutes { background: linear-gradient(45deg, #3b82f6, #1d4ed8); }
        &.middlewares { background: linear-gradient(45deg, #8b5cf6, #7c3aed); }
        &.services { background: linear-gradient(45deg, #10b981, #059669); }
        &.tls { background: linear-gradient(45deg, #f59e0b, #d97706); }
      }

      .card-content {
        h3 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 5px 0;
          color: #1f2937;
        }

        p {
          margin: 0;
          color: #6b7280;
          font-weight: 500;
        }
      }
    }
  }

  // Quick Actions
  .quick-actions {
    margin-bottom: 40px;

    h2 {
      font-size: 1.5rem;
      margin-bottom: 20px;
      color: #1f2937;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .action-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      text-decoration: none;
      transition: all 0.3s ease;

      &:hover {
        border-color: #3b82f6;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      }

      .action-icon {
        width: 50px;
        height: 50px;
        background: #3b82f6;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
      }

      .action-content {
        h3 {
          margin: 0 0 5px 0;
          color: #1f2937;
          font-size: 1.1rem;
        }

        p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }
      }
    }
  }

  // Resources Navigation
  .resources-navigation {
    margin-bottom: 40px;

    h2 {
      font-size: 1.5rem;
      margin-bottom: 20px;
      color: #1f2937;
    }

    .resources-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 15px;
    }

    .resource-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        border-color: #d1d5db;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .resource-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        font-size: 18px;
      }

      .resource-content {
        flex: 1;

        h3 {
          margin: 0 0 3px 0;
          color: #1f2937;
          font-size: 1rem;
        }

        p {
          margin: 0 0 5px 0;
          color: #6b7280;
          font-size: 0.85rem;
        }

        .resource-count {
          font-size: 0.8rem;
          color: #9ca3af;
        }
      }

      .resource-arrow {
        color: #d1d5db;
      }
    }
  }

  // Getting Started
  .getting-started {
    h2 {
      font-size: 1.5rem;
      margin-bottom: 20px;
      color: #1f2937;
    }

    .help-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .help-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 25px;

      h3 {
        margin: 0 0 10px 0;
        color: #1f2937;
        font-size: 1.1rem;
      }

      p {
        margin: 0 0 15px 0;
        color: #6b7280;
      }

      .help-link {
        color: #3b82f6;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 5px;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .traefik-dashboard {
    padding: 15px;

    .header {
      .header-content {
        flex-direction: column;
        gap: 20px;
        text-align: center;
      }

      .title-section {
        flex-direction: column;
        text-align: center;
        gap: 15px;
      }
    }

    .overview-section .cards-grid,
    .quick-actions .actions-grid,
    .resources-navigation .resources-grid,
    .getting-started .help-cards {
      grid-template-columns: 1fr;
    }
  }
}
</style>