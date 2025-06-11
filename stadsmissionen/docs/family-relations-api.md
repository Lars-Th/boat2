# Family Relations API Implementation Guide

This document provides a comprehensive guide for implementing the Family Relations API in the Stadsmissionen application.

## Overview

The Family Relations API manages relationships between participants, such as guardian-child relationships and sibling connections. This is essential for tracking family structures and dependencies within the organization.

## Current Status

- ✅ **Frontend Components**: Ready and functional using JSON data
- ✅ **Type Definitions**: Complete TypeScript interfaces
- ✅ **Mock API Service**: Implemented for development
- ✅ **Vue Composables**: Ready for API integration
- ⏳ **Real API Endpoints**: Needs backend implementation

## Data Structure

### FamilyRelation Interface

```typescript
export interface FamilyRelation {
  RelationID: number;
  ParticipantID: number;
  RelatedParticipantID: number;
  RelationType: string; // "Målsman" | "Syskon" | etc.
}
```

### Relation Types

- **"Målsman"**: Guardian-child relationship (ParticipantID is guardian, RelatedParticipantID is child)
- **"Syskon"**: Sibling relationship (bidirectional)

## Required API Endpoints

### 1. Get All Family Relations
```http
GET /api/family-relations
```

**Response:**
```json
{
  "data": [
    {
      "RelationID": 1,
      "ParticipantID": 1,
      "RelatedParticipantID": 2,
      "RelationType": "Målsman"
    }
  ],
  "success": true,
  "message": "Family relations retrieved successfully"
}
```

### 2. Get Family Relations by Participant
```http
GET /api/family-relations/participant/{participantId}
```

**Response:**
```json
{
  "data": [
    {
      "RelationID": 1,
      "ParticipantID": 1,
      "RelatedParticipantID": 2,
      "RelationType": "Målsman"
    }
  ],
  "success": true,
  "message": "Participant family relations retrieved successfully"
}
```

### 3. Create Family Relation
```http
POST /api/family-relations
Content-Type: application/json

{
  "ParticipantID": 1,
  "RelatedParticipantID": 2,
  "RelationType": "Målsman"
}
```

**Response:**
```json
{
  "data": {
    "RelationID": 10,
    "ParticipantID": 1,
    "RelatedParticipantID": 2,
    "RelationType": "Målsman"
  },
  "success": true,
  "message": "Family relation created successfully"
}
```

### 4. Update Family Relation
```http
PUT /api/family-relations/{relationId}
Content-Type: application/json

{
  "RelationType": "Syskon"
}
```

### 5. Delete Family Relation
```http
DELETE /api/family-relations/{relationId}
```

**Response:**
```json
{
  "data": true,
  "success": true,
  "message": "Family relation deleted successfully"
}
```

### 6. Get Relations by Type
```http
GET /api/family-relations/type/{relationType}
```

## Database Schema

### Recommended Table Structure

```sql
CREATE TABLE family_relations (
    RelationID INT PRIMARY KEY AUTO_INCREMENT,
    ParticipantID INT NOT NULL,
    RelatedParticipantID INT NOT NULL,
    RelationType VARCHAR(50) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (ParticipantID) REFERENCES participants(ParticipantID),
    FOREIGN KEY (RelatedParticipantID) REFERENCES participants(ParticipantID),

    -- Prevent duplicate relations
    UNIQUE KEY unique_relation (ParticipantID, RelatedParticipantID, RelationType),

    -- Prevent self-relations
    CHECK (ParticipantID != RelatedParticipantID)
);
```

### Indexes for Performance

```sql
CREATE INDEX idx_participant_relations ON family_relations(ParticipantID);
CREATE INDEX idx_related_participant_relations ON family_relations(RelatedParticipantID);
CREATE INDEX idx_relation_type ON family_relations(RelationType);
```

## Frontend Integration Steps

### Step 1: Update API Configuration

The API endpoints are already configured in `src/api/index.ts`. When the backend is ready, update the `USE_MOCK_API` environment variable:

```typescript
// In .env file
VITE_USE_MOCK_API=false
```

### Step 2: Use the Composable

Replace the current JSON import approach with the composable:

```vue
<script setup lang="ts">
import { useFamilyRelations } from '@/composables/useFamilyRelations';

const {
  familyRelations,
  guardianRelations,
  siblingRelations,
  familyRelationsLoading,
  familyRelationsError,
  refreshFamilyRelations,
  createFamilyRelation,
  deleteFamilyRelation,
  familyRelationsStats,
} = useFamilyRelations();
</script>
```

### Step 3: Update Components

The following components are ready for API integration:

- `src/views/FamilyConnections.vue` - Main family relations view
- `src/views/ParticipantDetail.vue` - Individual participant relations
- `src/views/ParticipantList.vue` - Family relations in participant list

## Error Handling

### Common Error Scenarios

1. **Circular Dependencies**: Prevent A being guardian of B while B is guardian of A
2. **Self-Relations**: Prevent participants from being related to themselves
3. **Duplicate Relations**: Prevent duplicate relation entries
4. **Invalid Participants**: Ensure both participants exist
5. **Invalid Relation Types**: Validate relation type values

### Frontend Error Handling

```typescript
const handleCreateRelation = async (relation: Partial<FamilyRelation>) => {
  try {
    const result = await createFamilyRelation(relation);
    if (result.success) {
      // Show success message
      toast.success('Familjerelation skapad', 'Relationen har lagts till framgångsrikt');
    } else {
      // Show error message
      toast.error('Fel vid skapande', result.message);
    }
  } catch (error) {
    toast.error('Oväntat fel', 'Ett oväntat fel uppstod vid skapandet av relationen');
  }
};
```

## Business Logic Considerations

### Guardian Relations
- One participant can be guardian to multiple children
- One child should typically have only one guardian (business rule)
- Guardian must be an adult (age validation)

### Sibling Relations
- Sibling relations are bidirectional
- If A is sibling to B, then B is automatically sibling to A
- Siblings should have the same guardian (consistency check)

### Data Validation

```typescript
const validateFamilyRelation = (relation: Partial<FamilyRelation>) => {
  const errors: string[] = [];

  if (!relation.ParticipantID) {
    errors.push('ParticipantID is required');
  }

  if (!relation.RelatedParticipantID) {
    errors.push('RelatedParticipantID is required');
  }

  if (relation.ParticipantID === relation.RelatedParticipantID) {
    errors.push('Participant cannot be related to themselves');
  }

  if (!['Målsman', 'Syskon'].includes(relation.RelationType || '')) {
    errors.push('Invalid relation type');
  }

  return errors;
};
```

## Testing

### API Testing

```bash
# Test get all relations
curl -X GET http://localhost:3000/api/family-relations

# Test create relation
curl -X POST http://localhost:3000/api/family-relations \
  -H "Content-Type: application/json" \
  -d '{"ParticipantID": 1, "RelatedParticipantID": 2, "RelationType": "Målsman"}'

# Test get participant relations
curl -X GET http://localhost:3000/api/family-relations/participant/1
```

### Frontend Testing

The components include comprehensive error handling and loading states. Test scenarios:

1. **Loading State**: Verify loading indicators appear during API calls
2. **Error State**: Test error handling when API calls fail
3. **Empty State**: Verify proper display when no relations exist
4. **Data Display**: Confirm relations are properly grouped and displayed

## Migration from JSON to API

### Current Implementation
```typescript
// Current approach (temporary)
import familyRelationsJsonData from '@/assets/data/familyRelations.json';
const familyRelations = computed(() => familyRelationsJsonData);
```

### API Implementation
```typescript
// Future approach (when API is ready)
const {
  data: familyRelations,
  loading: familyRelationsLoading,
  error: familyRelationsError,
  refresh: refreshFamilyRelations,
} = useApiList<FamilyRelation>(() => api.familyRelations.getAll(), {
  cacheKey: 'familyRelations',
});
```

## Performance Considerations

1. **Caching**: Use the `cacheKey` option in `useApiList` for client-side caching
2. **Pagination**: Consider pagination for large datasets
3. **Lazy Loading**: Load relations only when needed
4. **Debouncing**: Debounce search and filter operations

## Security Considerations

1. **Authorization**: Ensure users can only access relations they're authorized to see
2. **Data Validation**: Validate all inputs on both client and server
3. **Audit Trail**: Log all relation changes for compliance
4. **Privacy**: Consider GDPR implications for family data

## Next Steps

1. **Backend Implementation**: Implement the API endpoints according to this specification
2. **Database Setup**: Create the family_relations table with proper constraints
3. **Testing**: Thoroughly test all endpoints and edge cases
4. **Frontend Migration**: Switch from JSON data to API calls
5. **Documentation**: Update API documentation with actual endpoint details

## Support

For questions about the family relations implementation, refer to:

- `src/api/services/family-relations.service.ts` - Service implementation example
- `src/composables/useFamilyRelations.ts` - Vue composable for data management
- `src/views/FamilyConnections.vue` - Main UI component
- This documentation file for API specifications

The frontend is fully prepared for API integration and will work seamlessly once the backend endpoints are implemented according to this specification.
