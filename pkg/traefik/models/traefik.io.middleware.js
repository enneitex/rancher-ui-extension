import SteveModel from '@shell/plugins/steve/steve-class';

export default class Middleware extends SteveModel {

  // Extract middleware types from spec
  get middlewareTypes() {
    if (!this.spec) {
      return [];
    }

    return Object.keys(this.spec);
  }

  get primaryMiddlewareType() {
    return this.middlewareTypes.length > 0 ? this.middlewareTypes[0] : null;
  }

  get hasMultipleTypes() {
    return this.middlewareTypes.length > 1;
  }

  // Get the configuration for a specific middleware type
  getMiddlewareConfig(type) {
    return this.spec?.[type] || null;
  }

  // Helper method to check if a specific middleware type is configured
  hasMiddlewareType(type) {
    return this.middlewareTypes.includes(type);
  }
}