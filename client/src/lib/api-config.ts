/**
 * API Configuration for different environments
 * Handles GitHub.dev, development, and production environments
 */

export interface ApiConfig {
  baseUrl: string;
  websocketUrl: string;
}

/**
 * Detect the current environment and return appropriate API configuration
 */
export function getApiConfig(): ApiConfig {
  // Check if we're in GitHub.dev environment
  const isGitHubDev =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('github.dev') ||
      window.location.hostname.includes('app.github.dev'));

  if (isGitHubDev) {
    // Extract codespace name from hostname
    const codespaceName = window.location.hostname.split('-')[0];
    const backendUrl = `https://${codespaceName}-5000.app.github.dev`;

    return {
      baseUrl: backendUrl,
      websocketUrl: `wss://${codespaceName}-5000.app.github.dev`,
    };
  }

  // Development environment
  if (process.env.NODE_ENV === 'development') {
    return {
      baseUrl: 'http://localhost:5000',
      websocketUrl: 'ws://localhost:5000',
    };
  }

  // Production environment
  return {
    baseUrl: window.location.origin,
    websocketUrl: `wss://${window.location.host}`,
  };
}

/**
 * Get the full API URL for a given endpoint
 */
export function getApiUrl(endpoint: string): string {
  const config = getApiConfig();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${config.baseUrl}${cleanEndpoint}`;
}

/**
 * Get the WebSocket URL
 */
export function getWebSocketUrl(): string {
  const config = getApiConfig();
  return config.websocketUrl;
}
