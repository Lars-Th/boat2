# Prospector API Implementation

This document explains the newly implemented API-based Prospector functionality, replacing the previous store-based approach.

## Overview

The Prospector component now uses real API calls instead of local store data, following the pattern from the Odoo reference implementation. This enables real-time data fetching and integration with external prospecting services.

## Architecture

### API Service (`src/composables/useProspectorService.ts`)

The main API service that handles all prospector-related HTTP requests:

- **Authentication**: Uses Basic Auth with client credentials
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Reactive loading indicators for better UX
- **Type Safety**: Full TypeScript interfaces for API responses

### Mock Development Server (`server/mock-api.js`)

A local Express server that mimics the production API for development:

- **Port**: 3001
- **Authentication**: Mock Basic Auth validation
- **Data**: Uses existing mock data from `public/api/mock-prospector-data.json`
- **Endpoints**: All key endpoints from the reference implementation

## API Endpoints

Based on the Odoo reference implementation, these endpoints are now implemented:

### 1. Search Filters
```
GET /api/insight/filters
```
- **Auth**: Required
- **Purpose**: Get available search filter options
- **Response**: Filter categories and options

### 2. Landing Page Information  
```
GET /api/information/landingpage
```
- **Auth**: Not required
- **Purpose**: Get welcome text and feature information
- **Response**: Landing page content

### 3. Preview Filter Results
```
POST /api/insight/filters
```
- **Auth**: Required  
- **Purpose**: Quick preview of filter results count
- **Body**: Filter parameters array
- **Response**: Preview count and total available

### 4. Search Companies
```
POST /api/insight/prospects?skip=0&take=2500
```
- **Auth**: Required
- **Purpose**: Main search functionality with full results
- **Body**: Filter parameters array
- **Response**: Array of company objects

### 5. Add to Prospects
```
POST /api/insight/leads
```
- **Auth**: Required
- **Purpose**: Add companies to prospect/leads list
- **Body**: Array of company objects
- **Response**: Success confirmation

### 6. Validate Authentication
```
GET /api/insight/validatelogin
```
- **Auth**: Required
- **Purpose**: Validate client credentials
- **Response**: Authentication status

### 7. Account Details
```
GET /api/insight/account
```
- **Auth**: Required
- **Purpose**: Get account information and limits
- **Response**: Account details and usage stats

## Filter Parameter Format

The API expects filters in this format (based on reference implementation):

```javascript
[
  {
    "filterCategory": "city",
    "SelectOption": ["Stockholm"]
  },
  {
    "filterCategory": "branch", 
    "SelectOption": ["Technology"]
  },
  {
    "filterCategory": "employees",
    "SelectRange": {
      "min": 10,
      "max": 100
    }
  }
]
```

## Usage Instructions

### Development Mode

1. **Start the mock API server:**
   ```bash
   npm run api
   ```

2. **Start the Vue development server:**
   ```bash
   npm run dev
   ```

3. **Or run both simultaneously:**
   ```bash
   npm run dev:full
   ```

4. **Navigate to the Prospector page** and test the filtering functionality

### Production Mode

To switch to the production API:

1. **Update the base URL** in `src/composables/useProspectorService.ts`:
   ```typescript
   // Change from:
   const baseURL = 'http://localhost:3001'
   
   // To:
   const baseURL = 'https://prospector.ucsmindbite.cloud'
   ```

2. **Ensure client credentials are correct** for the production environment

## Component Changes

The `Prospector.vue` component has been updated to:

- ✅ Use the API service instead of the store
- ✅ Implement proper loading states
- ✅ Handle API errors gracefully  
- ✅ Show loading spinners during requests
- ✅ Disable buttons during loading
- ✅ Load landing page information on mount
- ✅ Support all filter types (address, branch, city, employee range)

## Key Features Implemented

### ✅ Real API Integration
- All TODO comments replaced with working API calls
- Proper error handling and loading states
- Authentication with client credentials

### ✅ Filter System
- Address/location filtering
- Industry/branch filtering  
- City filtering
- Employee count range filtering
- Clear all filters functionality

### ✅ Company Management
- Search and display companies
- Add companies to prospects
- Manage selected companies list
- Remove from selected companies

### ✅ User Experience
- Loading indicators
- Error messages with retry options
- Responsive design maintained
- Proper button states (disabled during loading)

## Error Handling

The implementation includes comprehensive error handling:

- **Network Errors**: Connection failures, timeouts
- **Authentication Errors**: Invalid credentials
- **API Errors**: Server-side errors with meaningful messages
- **Data Errors**: Malformed responses

All errors are displayed to the user with options to retry failed operations.

## Testing

1. **Test filtering**: Try different combinations of filters
2. **Test error handling**: Stop the API server to see error states  
3. **Test loading states**: Watch for loading indicators during requests
4. **Test authentication**: API calls should include proper auth headers

## Future Enhancements

Potential improvements for production use:

- **Pagination**: Implement proper pagination for large result sets
- **Caching**: Add response caching for better performance  
- **Debouncing**: Debounce filter inputs to reduce API calls
- **Export**: Add export functionality for prospect lists
- **Advanced Filters**: More sophisticated filtering options
- **Toast Notifications**: Better user feedback for actions

## Migration Notes

### Removed Dependencies
- `useProspectorStore` - No longer needed
- Store-based state management for prospector data

### Added Dependencies  
- `axios` - HTTP client (already installed)
- API service composable
- Type definitions for API responses

### Breaking Changes
- Prospector data is now fetched on-demand instead of preloaded
- Selected companies are managed locally instead of in global store
- Filter application requires API calls (async operations)

This implementation provides a solid foundation for real-world prospector functionality with proper API integration following industry best practices. 