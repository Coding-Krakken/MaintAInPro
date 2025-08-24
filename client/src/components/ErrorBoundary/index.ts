// Main Error Boundary Components
export { ErrorBoundary, type ErrorBoundaryProps, type ErrorFallbackProps, type ErrorInfo, type ErrorBoundaryState } from './ErrorBoundary';

// Fallback UI Components
export { GenericErrorFallback, type GenericErrorFallbackProps } from './GenericErrorFallback';
export { NetworkErrorFallback, type NetworkErrorFallbackProps } from './NetworkErrorFallback';
export { ChunkErrorFallback, type ChunkErrorFallbackProps } from './ChunkErrorFallback';

// Higher-Order Components and Utilities
export { 
  withErrorBoundary, 
  withNetworkErrorBoundary, 
  withChunkErrorBoundary,
  useErrorBoundaryWrapper,
  createErrorBoundary,
  type WithErrorBoundaryOptions,
  type ErrorBoundaryType
} from './withErrorBoundary';

// Default exports for convenience
export { ErrorBoundary as default } from './ErrorBoundary';