# API Layer Documentation

This directory contains the complete API layer for the application, organized following clean architecture principles and TypeScript best practices.

## 📁 Directory Structure

```
src/api/
├── client/                 # HTTP client and core functionality
│   ├── http-client.ts     # Main HTTP client with retry logic, error handling
│   ├── types.ts           # API types, interfaces, and response structures
│   └── index.ts           # Client exports
├── services/              # Domain services
│   ├── base.service.ts    # Abstract base service with common CRUD operations
│   ├── activity.service.ts        # Activity management service
│   ├── activity-type.service.ts   # Activity types service
│   ├── attendance.service.ts      # Attendance tracking service
│   ├── participant.service.ts     # Participant management service
│   └── index.ts           # Services exports
├── mocks/                 # Mock implementations for development
│   ├── mock-data.service.ts       # Mock service with JSON data
│   └── index.ts           # Mock exports
├── config/                # Configuration and setup
│   ├── api-config.ts      # Main API configuration class
│   └── index.ts           # Config exports
├── README.md              # This documentation
└── index.ts               # Main API exports and interface
```

## 🚀 Usage

### Basic Usage

```typescript
import api from '@/api';

// Get all activities
const activities = await api.activities.getAll();

// Get activity by ID
const activity = await api.activities.getById('123');

// Create new activity
const newActivity = await api.activities.create({
  Namn: 'New Activity',
  Beskrivning: 'Activity description',
  // ... other fields
});
```

### Using with Composables

```typescript
import { useApiList, useApiItem } from '@/composables/useApi';
import api from '@/api';

// In a Vue component
const { data: activities, loading, error } = useApiList(
  () => api.activities.getAll(),
  { cacheKey: 'activities' }
);

const { data: activity } = useApiItem(
  () => api.activities.getById(activityId.value),
  { cacheKey: `activity-${activityId.value}` }
);
```

### Advanced Configuration

```typescript
import { apiService } from '@/api';

// Set authentication token
if (apiService instanceof ApiConfiguration) {
  apiService.setAuthToken('your-jwt-token');
  apiService.setTimeout(60000); // 60 seconds
  apiService.setCustomHeader('X-Custom-Header', 'value');
}
```

## 🏗️ Architecture

### HTTP Client (`client/`)

- **`http-client.ts`**: Robust HTTP client with:
  - Automatic retry with exponential backoff
  - Request timeout handling
  - Structured error responses
  - Query parameter building
  - Configurable headers

- **`types.ts`**: Complete type definitions for:
  - API responses and errors
  - HTTP configuration
  - Request parameters
  - Service interfaces

### Services (`services/`)

- **`base.service.ts`**: Abstract base class providing:
  - Common CRUD operations (getAll, getById, create, update, delete)
  - Helper methods for custom endpoints
  - Consistent error handling
  - Type safety

- **Domain Services**: Specialized services extending the base:
  - `ActivityService`: Activity management with date ranges, types, etc.
  - `AttendanceService`: Attendance tracking with bulk operations
  - `ParticipantService`: Participant management with search capabilities
  - `ActivityTypeService`: Simple read-only service for activity types

### Configuration (`config/`)

- **`api-config.ts`**: Main configuration class that:
  - Initializes HTTP client
  - Creates all domain services
  - Provides configuration methods
  - Manages authentication

### Mocks (`mocks/`)

- **`mock-data.service.ts`**: Development mock service that:
  - Uses JSON data files
  - Simulates network delays
  - Provides realistic error scenarios
  - Maintains data consistency

## 🔧 Environment Configuration

The API layer automatically switches between mock and real implementations based on environment variables:

```env
# Use mock API in development
VITE_USE_MOCK_API=true

# Real API base URL
VITE_API_BASE_URL=https://api.yourdomain.com
```

## 📝 Adding New Services

1. **Create the service class**:

```typescript
// src/api/services/new-entity.service.ts
import type { NewEntity } from '@/types';
import { BaseService } from './base.service';

export class NewEntityService extends BaseService<NewEntity> {
  constructor(httpClient: any) {
    super(httpClient, '/new-entities');
  }

  // Add domain-specific methods
  async getByCustomField(value: string) {
    return this.get<NewEntity[]>(`${this.endpoint}/by-field`, { value });
  }
}
```

2. **Add to configuration**:

```typescript
// src/api/config/api-config.ts
import { NewEntityService } from '../services';

export class ApiConfiguration {
  public readonly newEntities: NewEntityService;

  constructor(baseURL?: string) {
    // ... existing code
    this.newEntities = new NewEntityService(this.httpClient);
  }
}
```

3. **Export from services**:

```typescript
// src/api/services/index.ts
export { NewEntityService } from './new-entity.service';
```

4. **Add to main API interface**:

```typescript
// src/api/index.ts
export const api = {
  // ... existing services
  newEntities: {
    getAll: (params?: RequestParams) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).newEntities.getAll(params),
    // ... other methods
  },
};
```

## 🧪 Testing

The mock service provides realistic data for development and testing:

- Simulates network delays (300ms default)
- Random error scenarios (5% chance)
- Consistent data relationships
- Full CRUD operations where applicable

## 🔒 Error Handling

All API calls return a consistent response structure:

```typescript
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: ApiError;
}

interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}
```

Error codes include:

- `NETWORK_ERROR`: Network connectivity issues
- `REQUEST_TIMEOUT`: Request exceeded timeout
- `BAD_REQUEST`: Invalid request (400)
- `UNAUTHORIZED`: Authentication required (401)
- `FORBIDDEN`: Access denied (403)
- `NOT_FOUND`: Resource not found (404)
- `CONFLICT`: Resource conflict (409)
- `VALIDATION_ERROR`: Validation failed (422)
- `SERVER_ERROR`: Server error (5xx)

## 🔄 Migration from Old Structure

The new API maintains backward compatibility with the old structure. Existing imports will continue to work:

```typescript
// Old import (still works)
import api from '@/services/api';

// New import (recommended)
import api from '@/api';
```

## 📚 Best Practices

1. **Use the composables**: Leverage `useApi`, `useApiList`, and `useApiMutation` for reactive data
2. **Handle errors gracefully**: Always check the `success` field and handle errors appropriately
3. **Use TypeScript**: Take advantage of full type safety throughout the API layer
4. **Cache wisely**: Use appropriate cache keys for frequently accessed data
5. **Environment awareness**: Use mock API for development, real API for production
