import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import TraefikRoutes from './routing/traefik-routes';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide extension metadata from package.json
  plugin.metadata = require('./package.json');

  // Load the Traefik product
  plugin.addProduct(require('./product'));

  // Add routes
  plugin.addRoutes(TraefikRoutes);

  // Add localization
  plugin.addL10n('./l10n/en-us.yaml', 'en-us');
}