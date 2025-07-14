/**
 * MCP Roots Service for MiniMe-MCP
 * Manages workspace boundaries and resource discovery hints
 * Provides context about which resources the server should focus on
 */

export class MCPRootsService {
    constructor(logger) {
        this.logger = logger;
        
        // Default roots that the server suggests focusing on
        this.roots = [
            {
                uri: 'file:///app',
                name: 'Application Root',
                description: 'Main application directory inside Docker container'
            },
            {
                uri: 'file:///workspace',
                name: 'Workspace Root',
                description: 'Development workspace directory'
            },
            {
                uri: 'project://current',
                name: 'Current Project',
                description: 'Currently active project context'
            }
        ];
        
        // Store IDE-provided roots separately
        this.ideProvidedRoots = [];
        this.currentProjectContext = null;
        
        this.logger.info(`Initialized roots service with ${this.roots.length} default roots`);
    }

    /**
     * List all available roots
     */
    async listRoots() {
        this.logger.info('Listing available roots');
        return this.roots;
    }

    /**
     * Update roots based on client suggestions
     * This allows clients to tell the server which resources to focus on
     */
    updateRoots(newRoots) {
        this.logger.info('Updating roots from client', { 
            previousCount: this.roots.length,
            newCount: newRoots.length 
        });
        
        // Store the current project context from roots
        this.currentProjectContext = null;
        
        // Validate and sanitize root URIs
        const validRoots = [];
        
        for (const root of newRoots) {
            try {
                // Validate URI format
                if (typeof root === 'string') {
                    // Simple string URI
                    const uri = new URL(root);
                    validRoots.push({
                        uri: root,
                        name: this.generateRootName(uri),
                        description: this.generateRootDescription(uri)
                    });
                } else if (root && typeof root === 'object' && root.uri) {
                    // Root object with metadata
                    const uri = new URL(root.uri);
                    validRoots.push({
                        uri: root.uri,
                        name: root.name || this.generateRootName(uri),
                        description: root.description || this.generateRootDescription(uri)
                    });
                }
            } catch (error) {
                this.logger.warn('Invalid root URI, skipping:', { root, error: error.message });
            }
        }
        
        // Update roots and maintain some defaults
        this.roots = [
            ...validRoots,
            // Always keep project root for MCP server functionality
            {
                uri: 'project://current',
                name: 'Current Project',
                description: 'Currently active project context'
            }
        ];
        
        this.logger.info(`Updated roots: ${this.roots.length} total`, {
            roots: this.roots.map(r => r.uri)
        });
        
        return this.roots;
    }

    /**
     * Get roots filtered by scheme
     */
    getRootsByScheme(scheme) {
        return this.roots.filter(root => {
            try {
                const uri = new URL(root.uri);
                return uri.protocol === `${scheme}:`;
            } catch {
                return false;
            }
        });
    }

    /**
     * Get file system roots specifically
     */
    getFileRoots() {
        return this.getRootsByScheme('file').map(root => {
            const uri = new URL(root.uri);
            return uri.pathname;
        });
    }

    /**
     * Check if a path is within any of the configured roots
     */
    isPathInRoots(path) {
        const fileRoots = this.getFileRoots();
        
        for (const root of fileRoots) {
            if (path.startsWith(root)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Generate a human-readable name for a root URI
     */
    generateRootName(uri) {
        const scheme = uri.protocol.slice(0, -1);
        
        switch (scheme) {
            case 'file':
                const pathName = uri.pathname.split('/').pop() || 'root';
                return `File: ${pathName}`;
            
            case 'project':
                return `Project: ${uri.hostname || 'current'}`;
            
            case 'http':
            case 'https':
                return `Web: ${uri.hostname}`;
            
            default:
                return `${scheme.toUpperCase()}: ${uri.hostname || uri.pathname}`;
        }
    }

    /**
     * Generate a description for a root URI
     */
    generateRootDescription(uri) {
        const scheme = uri.protocol.slice(0, -1);
        
        switch (scheme) {
            case 'file':
                return `File system directory: ${uri.pathname}`;
            
            case 'project':
                return `Project workspace for ${uri.hostname || 'current project'}`;
            
            case 'http':
            case 'https':
                return `Web resource at ${uri.href}`;
            
            default:
                return `Resource accessible via ${scheme} protocol`;
        }
    }

    /**
     * Notify about root changes (for resources service integration)
     */
    notifyRootChange(callback) {
        this.onRootChange = callback;
    }

    /**
     * Trigger root change notification
     */
    triggerRootChange() {
        if (this.onRootChange) {
            this.onRootChange(this.getFileRoots());
        }
    }

    /**
     * Store IDE-provided roots and extract project context
     * This is called when IDEs send their workspace roots
     */
    setIDEProvidedRoots(roots) {
        this.logger.info('Storing IDE-provided roots', { count: roots.length });
        this.ideProvidedRoots = roots;
        
        // Extract project context from the first file:// root
        for (const root of roots) {
            if (root.uri && root.uri.startsWith('file://')) {
                const projectInfo = this.extractProjectFromRoot(root);
                if (projectInfo) {
                    this.currentProjectContext = projectInfo;
                    this.logger.info('Extracted project context from IDE roots', projectInfo);
                    break;
                }
            }
        }
        
        return this.currentProjectContext;
    }

    /**
     * Extract project information from a root
     */
    extractProjectFromRoot(root) {
        try {
            const uri = new URL(root.uri);
            if (uri.protocol !== 'file:') return null;
            
            // Extract project name from either root.name or the path
            let projectName = null;
            
            // First try: Use the root name if provided by IDE
            if (root.name && root.name !== 'Workspace' && root.name !== 'Root') {
                projectName = root.name;
            }
            
            // Second try: Extract from the last segment of the path
            if (!projectName) {
                const pathSegments = uri.pathname.split('/').filter(s => s);
                if (pathSegments.length > 0) {
                    projectName = pathSegments[pathSegments.length - 1];
                }
            }
            
            if (projectName) {
                // Normalize the project name to kebab-case
                const normalizedName = projectName
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                
                return {
                    originalName: projectName,
                    normalizedName: normalizedName,
                    path: uri.pathname,
                    source: 'ide_roots'
                };
            }
        } catch (error) {
            this.logger.error('Failed to extract project from root', { root, error: error.message });
        }
        
        return null;
    }

    /**
     * Get current project context (if any)
     */
    getCurrentProjectContext() {
        return this.currentProjectContext;
    }
}