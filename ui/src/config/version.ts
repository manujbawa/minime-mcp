// Version configuration
// This file reads version from build-time environment variable
// DO NOT EDIT MANUALLY - Version comes from /VERSION file

// Vite uses import.meta.env instead of process.env
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0-dev';