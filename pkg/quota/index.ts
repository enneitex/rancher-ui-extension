import { importTypes } from '@rancher/auto-import';
import { IPlugin, PanelLocation } from '@shell/core/types';
import { NAMESPACE } from '@shell/config/types';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Add Capacity panel to namespace detail view
  // Displays resource quota gauges directly on the detail page
  plugin.addPanel(
    PanelLocation.DETAIL_TOP,
    {
      resource: [NAMESPACE],
      mode:     ['detail']
    },
    {
      component: () => import('./components/NamespaceCapacity.vue')
    }
  );
}
