/**
 * Service Registry
 * Central registry for all application services to enable proper dependency injection
 */

class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.initialized = false;
    }

    /**
     * Register a service
     */
    register(name, service) {
        if (this.services.has(name)) {
            throw new Error(`Service ${name} is already registered`);
        }
        this.services.set(name, service);
        return this;
    }

    /**
     * Get a registered service
     */
    get(name) {
        if (!this.services.has(name)) {
            throw new Error(`Service ${name} is not registered`);
        }
        return this.services.get(name);
    }

    /**
     * Check if a service is registered
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Get all registered service names
     */
    getServiceNames() {
        return Array.from(this.services.keys());
    }

    /**
     * Clear all services (useful for testing)
     */
    clear() {
        this.services.clear();
        this.initialized = false;
    }

    /**
     * Mark registry as initialized
     */
    setInitialized() {
        this.initialized = true;
    }

    /**
     * Check if registry is initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Get all services as a plain object
     * Useful for passing to routes and other modules
     */
    getAllAsObject() {
        const servicesObject = {};
        for (const [name, service] of this.services) {
            servicesObject[name] = service;
        }
        return servicesObject;
    }
}

// Create singleton instance
const serviceRegistry = new ServiceRegistry();

export default serviceRegistry;