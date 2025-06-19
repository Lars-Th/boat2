import type { Contact } from '@/types';
import type { Customer } from '@/types';
import type {
  ContactWithRelations,
  CustomerWithRelations,
  EmployeeWithRelations,
  FamilyRelationWithRelations,
  ParticipantWithRelations,
  RelationshipConfig,
  TimeEntryWithRelations,
  WorkOrderWithRelations,
} from '@/types/relationships';

// Work Order Relationships
export const workOrderRelationships: RelationshipConfig<
  any,
  {
    customer: CustomerWithRelations;
    contact: ContactWithRelations;
    assignedUsers: EmployeeWithRelations[];
    timeEntries: TimeEntryWithRelations[];
  }
> = {
  relationships: {
    customer: {
      type: 'belongsTo',
      foreignKey: 'CustomerID',
      targetEntity: 'customers',
      targetKey: 'CustomerID',
      cache: true,
      eager: true,
    },
    contact: {
      type: 'belongsTo',
      foreignKey: 'ContactPersonID',
      targetEntity: 'contacts',
      targetKey: 'ContactID',
      cache: true,
      eager: false,
    },
    assignedUsers: {
      type: 'manyToMany',
      foreignKey: 'AssignedUserIDs',
      targetEntity: 'employees',
      targetKey: 'id',
      cache: true,
      eager: true,
    },
    timeEntries: {
      type: 'hasMany',
      foreignKey: 'WorkOrderID',
      targetEntity: 'timeEntries',
      targetKey: 'WorkOrderID',
      cache: false, // Time entries change frequently
      eager: false,
    },
  },
};

// Customer Relationships
export const customerRelationships: RelationshipConfig<
  Customer,
  {
    contacts: ContactWithRelations[];
    workOrders: WorkOrderWithRelations[];
  }
> = {
  relationships: {
    contacts: {
      type: 'hasMany',
      foreignKey: 'CustomerID',
      targetEntity: 'contacts',
      targetKey: 'CustomerID',
      cache: true,
      eager: true,
    },
    workOrders: {
      type: 'hasMany',
      foreignKey: 'CustomerID',
      targetEntity: 'workOrders',
      targetKey: 'CustomerID',
      cache: false,
      eager: false,
    },
  },
};

// Contact Relationships
export const contactRelationships: RelationshipConfig<
  Contact,
  {
    customer: CustomerWithRelations;
    workOrders: WorkOrderWithRelations[];
  }
> = {
  relationships: {
    customer: {
      type: 'belongsTo',
      foreignKey: 'CustomerID',
      targetEntity: 'customers',
      targetKey: 'CustomerID',
      cache: true,
      eager: true,
    },
    workOrders: {
      type: 'hasMany',
      foreignKey: 'ContactPersonID',
      targetEntity: 'workOrders',
      targetKey: 'ContactPersonID',
      cache: false,
      eager: false,
    },
  },
};

// Employee Relationships
export const employeeRelationships: RelationshipConfig<
  any,
  {
    workOrders: WorkOrderWithRelations[];
    timeEntries: TimeEntryWithRelations[];
  }
> = {
  relationships: {
    workOrders: {
      type: 'manyToMany',
      foreignKey: 'id',
      targetEntity: 'workOrders',
      targetKey: 'AssignedUserIDs',
      cache: false,
      eager: false,
    },
    timeEntries: {
      type: 'hasMany',
      foreignKey: 'id',
      targetEntity: 'timeEntries',
      targetKey: 'UserID',
      cache: false,
      eager: false,
    },
  },
};

// Time Entry Relationships
export const timeEntryRelationships: RelationshipConfig<
  any,
  {
    workOrder: WorkOrderWithRelations;
    user: EmployeeWithRelations;
  }
> = {
  relationships: {
    workOrder: {
      type: 'belongsTo',
      foreignKey: 'WorkOrderID',
      targetEntity: 'workOrders',
      targetKey: 'WorkOrderID',
      cache: true,
      eager: true,
    },
    user: {
      type: 'belongsTo',
      foreignKey: 'UserID',
      targetEntity: 'employees',
      targetKey: 'id',
      cache: true,
      eager: true,
    },
  },
};

// Participant Relationships
export const participantRelationships: RelationshipConfig<
  any,
  {
    familyRelations: FamilyRelationWithRelations[];
    guardians: ParticipantWithRelations[];
    children: ParticipantWithRelations[];
    siblings: ParticipantWithRelations[];
  }
> = {
  relationships: {
    familyRelations: {
      type: 'hasMany',
      foreignKey: 'ParticipantID',
      targetEntity: 'familyRelations',
      targetKey: 'ParticipantID',
      cache: true,
      eager: true,
    },
    guardians: {
      type: 'manyToMany',
      foreignKey: 'ParticipantID',
      targetEntity: 'participants',
      targetKey: 'ParticipantID',
      through: 'familyRelations',
      cache: true,
      eager: true,
    },
    children: {
      type: 'manyToMany',
      foreignKey: 'ParticipantID',
      targetEntity: 'participants',
      targetKey: 'ParticipantID',
      through: 'familyRelations',
      cache: true,
      eager: true,
    },
    siblings: {
      type: 'manyToMany',
      foreignKey: 'ParticipantID',
      targetEntity: 'participants',
      targetKey: 'ParticipantID',
      through: 'familyRelations',
      cache: true,
      eager: true,
    },
  },
};

// Family Relation Relationships
export const familyRelationRelationships: RelationshipConfig<
  any,
  {
    participant: ParticipantWithRelations;
    relatedParticipant: ParticipantWithRelations;
  }
> = {
  relationships: {
    participant: {
      type: 'belongsTo',
      foreignKey: 'ParticipantID',
      targetEntity: 'participants',
      targetKey: 'ParticipantID',
      cache: true,
      eager: true,
    },
    relatedParticipant: {
      type: 'belongsTo',
      foreignKey: 'RelatedParticipantID',
      targetEntity: 'participants',
      targetKey: 'ParticipantID',
      cache: true,
      eager: true,
    },
  },
};

// Entity to relationship config mapping
export const entityRelationships = {
  workOrders: workOrderRelationships,
  customers: customerRelationships,
  contacts: contactRelationships,
  employees: employeeRelationships,
  timeEntries: timeEntryRelationships,
  participants: participantRelationships,
  familyRelations: familyRelationRelationships,
} as const;

// Helper function to get relationship config for an entity
export function getRelationshipConfig(entityType: string) {
  return entityRelationships[entityType as keyof typeof entityRelationships];
}
