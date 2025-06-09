# Relationship Template for Store-Based Architecture

## Overview

This template standardizes how to handle relationships between entities using foreign keys stored within each entity. Relationships are resolved by looking up related data from appropriate stores through computed properties and getters.

## Core Principles

1. **Foreign keys are stored in entities** - Each entity stores the IDs of related entities
2. **Stores manage their own entities** - Each store is responsible for one primary entity type
3. **Relationships are resolved via getters** - Cross-store lookups happen through computed getters
4. **Components use multiple stores** - Views and components import and use multiple stores as needed

## Relationship Types

### 1. One-to-Many (Parent → Children)

**Example: Customer → Contact Persons**

```typescript
// Parent Entity (Customer)
export interface Customer extends BaseEntity {
  id: number
  companyName: string
  // ... other customer fields
  // Note: No contactPersonIds needed - relationship is managed by children
}

// Child Entity (ContactPerson) 
export interface ContactPerson extends BaseEntity {
  id: number
  name: string
  customerId: number  // Foreign key to parent
  // ... other contact person fields
}

// Parent Store (Customer Store)
export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [] as Customer[],
    contactPersons: [] as ContactPerson[]  // Children managed in same store
  }),
  
  getters: {
    getCustomerById: (state) => (id: number): Customer | undefined => 
      state.customers.find(customer => customer.id === id),
      
    getContactPersonsByCustomerId: (state) => (customerId: number): ContactPerson[] =>
      state.contactPersons.filter(contact => contact.customerId === customerId),
      
    getMainContactByCustomerId: (state) => (customerId: number): ContactPerson | undefined =>
      state.contactPersons.find(contact => 
        contact.customerId === customerId && contact.isMainContact
      ),
  },
  
  actions: {
    // Parent CRUD
    addCustomer(customer: Omit<Customer, 'id'>) {
      this.customers.push({ ...customer, id: Date.now() })
    },
    
    removeCustomer(id: number) {
      this.customers = this.customers.filter(c => c.id !== id)
      // CASCADE: Remove all related children
      this.contactPersons = this.contactPersons.filter(cp => cp.customerId !== id)
    },
    
    // Children CRUD
    addContactPerson(contactPerson: Omit<ContactPerson, 'id'>) {
      this.contactPersons.push({ ...contactPerson, id: Date.now() })
    },
    
    removeContactPerson(id: number) {
      this.contactPersons = this.contactPersons.filter(cp => cp.id !== id)
    }
  }
})
```

**JSON Structure:**
```json
{
  "customers": [
    { "id": 1, "companyName": "Tech Corp", "..." }
  ],
  "contactPersons": [
    { "id": 1, "name": "John Doe", "customerId": 1, "isMainContact": true },
    { "id": 2, "name": "Jane Smith", "customerId": 1, "isMainContact": false }
  ]
}
```

### 2. One-to-One (Entity A ↔ Entity B)

**Example: User → Profile**

```typescript
// Primary Entity
export interface User extends BaseEntity {
  id: number
  email: string
  profileId?: number  // Optional foreign key to profile
}

// Related Entity
export interface Profile extends BaseEntity {
  id: number
  userId: number  // Required foreign key to user
  firstName: string
  lastName: string
}

// Store managing both entities
export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as User[],
    profiles: [] as Profile[]
  }),
  
  getters: {
    getUserById: (state) => (id: number): User | undefined =>
      state.users.find(user => user.id === id),
      
    getProfileByUserId: (state) => (userId: number): Profile | undefined =>
      state.profiles.find(profile => profile.userId === userId),
      
    getUserWithProfile: (state) => (userId: number) => {
      const user = state.users.find(u => u.id === userId)
      const profile = state.profiles.find(p => p.userId === userId)
      return user ? { ...user, profile } : undefined
    }
  },
  
  actions: {
    addUser(user: Omit<User, 'id'>) {
      this.users.push({ ...user, id: Date.now() })
    },
    
    addProfile(profile: Omit<Profile, 'id'>) {
      this.profiles.push({ ...profile, id: Date.now() })
      
      // Update user's profileId for bidirectional reference (optional)
      const user = this.users.find(u => u.id === profile.userId)
      if (user) {
        user.profileId = profile.id
      }
    },
    
    removeUser(id: number) {
      this.users = this.users.filter(u => u.id !== id)
      // CASCADE: Remove related profile
      this.profiles = this.profiles.filter(p => p.userId !== id)
    }
  }
})
```

### 3. Many-to-Many (Entity A ↔ Entity B through Junction)

**Example: Projects ↔ Team Members**

```typescript
// Entity A
export interface Project extends BaseEntity {
  id: number
  name: string
  description: string
}

// Entity B  
export interface TeamMember extends BaseEntity {
  id: number
  name: string
  email: string
}

// Junction Entity
export interface ProjectAssignment extends BaseEntity {
  id: number
  projectId: number     // Foreign key to Project
  teamMemberId: number  // Foreign key to TeamMember
  role: string          // Additional relationship metadata
  assignedAt: Date
}

// Store managing all related entities
export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [] as Project[],
    teamMembers: [] as TeamMember[],
    projectAssignments: [] as ProjectAssignment[]
  }),
  
  getters: {
    getProjectById: (state) => (id: number): Project | undefined =>
      state.projects.find(project => project.id === id),
      
    getTeamMemberById: (state) => (id: number): TeamMember | undefined =>
      state.teamMembers.find(member => member.id === id),
      
    getTeamMembersByProjectId: (state) => (projectId: number) => {
      const assignments = state.projectAssignments.filter(a => a.projectId === projectId)
      return assignments.map(assignment => ({
        ...state.teamMembers.find(member => member.id === assignment.teamMemberId)!,
        role: assignment.role,
        assignedAt: assignment.assignedAt
      }))
    },
    
    getProjectsByTeamMemberId: (state) => (teamMemberId: number) => {
      const assignments = state.projectAssignments.filter(a => a.teamMemberId === teamMemberId)
      return assignments.map(assignment => ({
        ...state.projects.find(project => project.id === assignment.projectId)!,
        role: assignment.role,
        assignedAt: assignment.assignedAt
      }))
    }
  },
  
  actions: {
    assignTeamMemberToProject(projectId: number, teamMemberId: number, role: string) {
      this.projectAssignments.push({
        id: Date.now(),
        projectId,
        teamMemberId,
        role,
        assignedAt: new Date()
      })
    },
    
    removeAssignment(projectId: number, teamMemberId: number) {
      this.projectAssignments = this.projectAssignments.filter(
        a => !(a.projectId === projectId && a.teamMemberId === teamMemberId)
      )
    }
  }
})
```

## Component Usage Patterns

### Single Store Lookup
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCustomerStore } from '@/storages/customerStorage'

const route = useRoute()
const customerStore = useCustomerStore()

// Get main entity
const customer = computed(() => 
  customerStore.getCustomerById(Number(route.params.id))
)

// Get related entities via foreign key
const contactPersons = computed(() => 
  customerStore.getContactPersonsByCustomerId(Number(route.params.id))
)

const mainContact = computed(() =>
  customerStore.getMainContactByCustomerId(Number(route.params.id))
)
</script>
```

### Cross-Store Lookup
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/storages/projectStorage'
import { useUserStore } from '@/storages/userStorage'

const projectStore = useProjectStore()
const userStore = useUserStore()

// Get project with enriched team member data
const projectWithTeam = computed(() => {
  const project = projectStore.getProjectById(projectId.value)
  if (!project) return null
  
  const teamAssignments = projectStore.getTeamMembersByProjectId(project.id)
  const enrichedTeam = teamAssignments.map(assignment => ({
    ...assignment,
    userProfile: userStore.getProfileByUserId(assignment.id)
  }))
  
  return {
    ...project,
    team: enrichedTeam
  }
})
</script>
```

## File Structure Template

```
src/storages/
├── [entity]Storage.ts           # Main store file
├── [entity].json               # Primary entities data
├── [relatedEntity].json        # Related entities data (if in same store)
└── [junctionEntity].json       # Junction table data (for many-to-many)
```

**Example:**
```
src/storages/
├── customerStorage.ts
├── customers.json
├── contactPersons.json
├── projectStorage.ts  
├── projects.json
├── teamMembers.json
└── projectAssignments.json
```

## Migration Checklist

When creating new relationships:

### ✅ Planning Phase
- [ ] Identify relationship type (one-to-many, one-to-one, many-to-many)
- [ ] Determine which store should manage the relationship
- [ ] Design foreign key structure
- [ ] Plan cascade deletion strategy

### ✅ Implementation Phase
- [ ] Define TypeScript interfaces with foreign keys
- [ ] Create/update store with appropriate getters
- [ ] Add CRUD actions with proper cascade handling
- [ ] Create JSON data files with foreign key relationships
- [ ] Add validation for foreign key constraints

### ✅ Component Integration
- [ ] Import required stores in components
- [ ] Use computed properties for reactive lookups
- [ ] Handle loading states and missing relationships
- [ ] Add error handling for broken foreign keys

### ✅ Testing
- [ ] Test all relationship getters
- [ ] Verify cascade deletion works correctly
- [ ] Test relationship creation and updates
- [ ] Validate data integrity

## Advanced Patterns

### Computed Relationship Enrichment
```typescript
// In store getters
getCustomersWithMainContacts: (state) => {
  return state.customers.map(customer => ({
    ...customer,
    mainContact: state.contactPersons.find(cp => 
      cp.customerId === customer.id && cp.isMainContact
    )
  }))
}
```

### Relationship Validation
```typescript
// Action with foreign key validation
addContactPerson(contactPerson: Omit<ContactPerson, 'id'>) {
  // Validate foreign key exists
  const customerExists = this.customers.some(c => c.id === contactPerson.customerId)
  if (!customerExists) {
    throw new Error(`Customer with ID ${contactPerson.customerId} does not exist`)
  }
  
  this.contactPersons.push({ ...contactPerson, id: Date.now() })
}
```

### Lazy Loading Pattern
```typescript
// For large datasets, load relationships on demand
getters: {
  getContactPersonsByCustomerId: (state) => (customerId: number) => {
    // Return cached if available
    if (state.contactPersonsCache[customerId]) {
      return state.contactPersonsCache[customerId]
    }
    
    // Load and cache
    const contacts = state.contactPersons.filter(cp => cp.customerId === customerId)
    state.contactPersonsCache[customerId] = contacts
    return contacts
  }
}
```

## Best Practices

1. **Store Responsibility**: Each store should manage related entities that are closely coupled
2. **Foreign Key Validation**: Always validate foreign keys exist before creating relationships
3. **Cascade Operations**: Implement proper cascade delete to maintain data integrity
4. **Computed Properties**: Use Vue's computed properties for reactive relationship lookups
5. **Error Handling**: Handle cases where foreign keys point to non-existent entities
6. **Performance**: Consider caching for frequently accessed relationships
7. **Type Safety**: Use TypeScript interfaces to enforce relationship contracts

This template provides a standardized approach that AI can easily understand and replicate across different entities and relationship types. 