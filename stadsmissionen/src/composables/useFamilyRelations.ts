import { type Ref, computed, ref } from 'vue';
import type { FamilyRelation, Participant } from '@/types';

// Define relation types as a union
export type RelationType = 'Målsman' | 'Syskon';

// Define interfaces for family member and group types
interface FamilyMember {
  relation: FamilyRelation;
  participant: Participant | undefined;
  relationType: RelationType;
  isGuardian: boolean;
  isSibling: boolean;
}

interface SiblingRelation {
  person1: Participant;
  person2: Participant;
}

interface FamilyGroup {
  guardian: Participant;
  children: Participant[];
  siblings: SiblingRelation[];
}

// Type for the groups map
type FamilyGroupsMap = Map<number, FamilyGroup>;

/**
 * Composable for managing family relations data
 *
 * This demonstrates how to properly integrate family relations API
 * with Vue.js reactive patterns and error handling.
 */
export function useFamilyRelations() {
  // For now, we'll use the mock API approach
  // When the real API is ready, simply uncomment the API calls below

  /*
  // Real API implementation (uncomment when ready):
  const {
    data: familyRelations,
    loading: familyRelationsLoading,
    error: familyRelationsError,
    refresh: refreshFamilyRelations,
  } = useApiList<FamilyRelation>(() => api.familyRelations.getAll(), {
    cacheKey: 'familyRelations',
  });
  */

  // Temporary JSON data approach (remove when API is ready)
  const familyRelations = ref<FamilyRelation[]>([]);
  const familyRelationsLoading = ref(false);
  const familyRelationsError = ref<Error | null>(null);

  // Load JSON data (temporary)
  const loadFamilyRelations = async () => {
    familyRelationsLoading.value = true;
    familyRelationsError.value = null;

    try {
      // Import JSON data dynamically with proper typing
      const { default: jsonData } = await import('@/assets/data/familyRelations.json');
      // Validate that the imported data matches our expected type
      if (
        Array.isArray(jsonData) &&
        jsonData.every(
          item =>
            'RelationID' in item &&
            'ParticipantID' in item &&
            'RelatedParticipantID' in item &&
            'RelationType' in item
        )
      ) {
        familyRelations.value = jsonData as FamilyRelation[];
      } else {
        throw new Error('Invalid family relations data format');
      }
    } catch (error) {
      familyRelationsError.value =
        error instanceof Error ? error : new Error('Failed to load family relations');
    } finally {
      familyRelationsLoading.value = false;
    }
  };

  // Initialize data loading
  loadFamilyRelations();

  const refreshFamilyRelations = async () => {
    await loadFamilyRelations();
  };

  // Computed properties for different relation types
  const guardianRelations = computed(() =>
    familyRelations.value.filter(r => r.RelationType === 'Målsman')
  );

  const siblingRelations = computed(() =>
    familyRelations.value.filter(r => r.RelationType === 'Syskon')
  );

  // Helper function to get relations for a specific participant
  const getParticipantRelations = (participantId: number) => {
    return computed(() =>
      familyRelations.value.filter(
        rel => rel.ParticipantID === participantId || rel.RelatedParticipantID === participantId
      )
    );
  };

  // Helper function to get family members for a participant
  const getFamilyMembers = (participantId: number, participants: Ref<Participant[]>) => {
    return computed(() => {
      const relations = familyRelations.value.filter(
        rel => rel.ParticipantID === participantId || rel.RelatedParticipantID === participantId
      );

      return relations.map(rel => {
        const relatedId =
          rel.ParticipantID === participantId ? rel.RelatedParticipantID : rel.ParticipantID;

        const relatedParticipant = participants.value.find(p => p.ParticipantID === relatedId);

        return {
          relation: rel,
          participant: relatedParticipant,
          relationType: rel.RelationType,
          isGuardian: rel.RelationType === 'Målsman',
          isSibling: rel.RelationType === 'Syskon',
        };
      });
    });
  };

  // Helper function to create family groups for visualization
  const createFamilyGroups = (participants: Ref<Participant[]>) => {
    return computed(() => {
      const groups: FamilyGroupsMap = new Map();

      // Process guardian relations to create family groups
      guardianRelations.value.forEach(relation => {
        const guardianId = relation.ParticipantID;
        const childId = relation.RelatedParticipantID;

        if (!groups.has(guardianId)) {
          const guardian = participants.value.find(p => p.ParticipantID === guardianId);
          if (guardian) {
            groups.set(guardianId, {
              guardian,
              children: [],
              siblings: [],
            });
          }
        }

        const group = groups.get(guardianId);
        const child = participants.value.find(p => p.ParticipantID === childId);
        if (group && child) {
          group.children.push(child);
        }
      });

      // Add sibling relations to appropriate groups
      siblingRelations.value.forEach(relation => {
        const person1Id = relation.ParticipantID;
        const person2Id = relation.RelatedParticipantID;

        // Find which family group these siblings belong to
        for (const [, group] of groups.entries()) {
          const person1InGroup = group.children.some(child => child.ParticipantID === person1Id);
          const person2InGroup = group.children.some(child => child.ParticipantID === person2Id);

          if (person1InGroup || person2InGroup) {
            const person1 = participants.value.find(p => p.ParticipantID === person1Id);
            const person2 = participants.value.find(p => p.ParticipantID === person2Id);

            if (person1 && person2) {
              group.siblings.push({ person1, person2 });
            }
            break;
          }
        }
      });

      return Array.from(groups.values()).filter(
        (group): group is FamilyGroup => group.guardian !== undefined
      );
    });
  };

  // Statistics
  const familyRelationsStats = computed(() => ({
    totalRelations: familyRelations.value.length,
    guardianRelations: guardianRelations.value.length,
    siblingRelations: siblingRelations.value.length,
    uniqueParticipants: new Set([
      ...familyRelations.value.map(r => r.ParticipantID),
      ...familyRelations.value.map(r => r.RelatedParticipantID),
    ]).size,
  }));

  // API methods for CRUD operations (ready for when API is implemented)
  const createFamilyRelation = async (relation: Partial<FamilyRelation>) => {
    try {
      // TODO: Implement when API is ready
      // const response = await api.familyRelations.create(relation);
      // if (response.success) {
      //   await refreshFamilyRelations();
      //   return response;
      // }
      console.log('Create family relation:', relation);
      return { success: false, message: 'API not implemented yet' };
    } catch (error) {
      console.error('Error creating family relation:', error);
      return { success: false, message: 'Failed to create family relation' };
    }
  };

  const deleteFamilyRelation = async (relationId: string) => {
    try {
      // TODO: Implement when API is ready
      // const response = await api.familyRelations.delete(relationId);
      // if (response.success) {
      //   await refreshFamilyRelations();
      //   return response;
      // }
      console.log('Delete family relation:', relationId);
      return { success: false, message: 'API not implemented yet' };
    } catch (error) {
      console.error('Error deleting family relation:', error);
      return { success: false, message: 'Failed to delete family relation' };
    }
  };

  return {
    // Data
    familyRelations: computed(() => familyRelations.value),
    guardianRelations,
    siblingRelations,

    // Loading states
    familyRelationsLoading: computed(() => familyRelationsLoading.value),
    familyRelationsError: computed(() => familyRelationsError.value),

    // Actions
    refreshFamilyRelations,
    createFamilyRelation,
    deleteFamilyRelation,

    // Helper functions
    getParticipantRelations,
    getFamilyMembers,
    createFamilyGroups,

    // Statistics
    familyRelationsStats,
  };
}

// Update the return type interface
export interface UseFamilyRelationsReturn {
  familyRelations: Ref<FamilyRelation[]>;
  guardianRelations: Ref<FamilyRelation[]>;
  siblingRelations: Ref<FamilyRelation[]>;
  familyRelationsLoading: Ref<boolean>;
  familyRelationsError: Ref<Error | null>;
  refreshFamilyRelations: () => Promise<void>;
  createFamilyRelation: (
    relation: Partial<FamilyRelation>
  ) => Promise<{ success: boolean; message: string }>;
  deleteFamilyRelation: (relationId: string) => Promise<{ success: boolean; message: string }>;
  getParticipantRelations: (participantId: number) => Ref<FamilyRelation[]>;
  getFamilyMembers: (
    participantId: number,
    participants: Ref<Participant[]>
  ) => Ref<FamilyMember[]>;
  createFamilyGroups: (participants: Ref<Participant[]>) => Ref<FamilyGroup[]>;
  familyRelationsStats: Ref<{
    totalRelations: number;
    guardianRelations: number;
    siblingRelations: number;
    uniqueParticipants: number;
  }>;
}
