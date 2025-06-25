// Organized type re-exports

// Core business entities
export * from './entities';

// Enums
export * from './enums';

// UI components and related types
export * from './ui';

// Authentication and user types
export * from './auth';

// Activities, participants, and attendance
export * from './activities';

// Validation types
export * from './validation';

// Composable return types
export * from './composables';

// Specialized types (keep existing organization)
export * from './relationships';
export * from './enhanced';
export * from './api';

// Import API types from the API client for backward compatibility
import type { ApiError, ApiResponse } from '../api/client/types';
export type { ApiError, ApiResponse };
