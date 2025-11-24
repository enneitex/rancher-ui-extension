import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide extension metadata from package.json
  plugin.metadata = require('./package.json');

  // Load Traefik product configuration
  plugin.addProduct(require('./product'));

  // Ensure that traefik CRD list uses server-side pagination
  plugin.enableServerSidePagination?.({
    cluster: {
      resources: {
        enableSome: {
          enabled: ['traefik.io.ingressroute', 'traefik.io.middleware', 'traefik.io.ingressroutetcp', 'traefik.io.tlsoption'],
        }
      }
    }
  })
}