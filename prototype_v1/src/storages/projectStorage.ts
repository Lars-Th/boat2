import { defineStore } from 'pinia'
import type { BaseEntity, BaseStoreState } from './baseTypes'
import { validateForeignKey, cascadeDelete, generateId } from './baseTypes'

// =============================================================================
// ENTITY INTERFACES
// =============================================================================

export interface Project extends BaseEntity {
  id: number
  name: string
  description: string
  status: 'Planning' | 'Active' | 'Completed' | 'On Hold'
  startDate: Date
  endDate?: Date
  budget: number
}

export interface TeamMember extends BaseEntity {
  id: number
  firstName: string
  lastName: string
  email: string
  position: string
  department: string
  isActive: boolean
}

// Junction entity for many-to-many relationship
export interface ProjectAssignment extends BaseEntity {
  id: number
  projectId: number     // Foreign key to Project
  teamMemberId: number  // Foreign key to TeamMember
  role: string          // Role in this specific project
  hourlyRate: number    // Rate for this assignment
  assignedAt: Date
  unassignedAt?: Date
  isLead: boolean       // Is this person the project lead?
}

// =============================================================================
// STORE INTERFACES
// =============================================================================

interface ProjectStoreState extends BaseStoreState {
  projects: Project[]
  teamMembers: TeamMember[]
  projectAssignments: ProjectAssignment[]
}

// =============================================================================
// RELATIONSHIP METADATA
// =============================================================================

const RELATIONSHIPS = {
  PROJECT_TEAM_MEMBERS: {
    type: 'many-to-many' as const,
    entityA: 'Project',
    entityB: 'TeamMember',
    junctionEntity: 'ProjectAssignment',
    foreignKeyA: 'projectId',
    foreignKeyB: 'teamMemberId',
    cascadeDelete: true
  }
}

// =============================================================================
// STORE DEFINITION
// =============================================================================

export const useProjectStorage = defineStore('project', {
  state: (): ProjectStoreState => ({
    projects: [],
    teamMembers: [],
    projectAssignments: [],
    loading: false,
    error: null,
    lastUpdated: null
  }),

  // =============================================================================
  // GETTERS
  // =============================================================================
  
  getters: {
    // Basic entity getters
    getProjectById: (state) => (id: number): Project | undefined =>
      state.projects.find(project => project.id === id),
    
    getTeamMemberById: (state) => (id: number): TeamMember | undefined =>
      state.teamMembers.find(member => member.id === id),

    getAssignmentById: (state) => (id: number): ProjectAssignment | undefined =>
      state.projectAssignments.find(assignment => assignment.id === id),

    // Status-based getters
    activeProjects: (state): Project[] =>
      state.projects.filter(project => project.status === 'Active'),
    
    activeTeamMembers: (state): TeamMember[] =>
      state.teamMembers.filter(member => member.isActive),

    // =============================================================================
    // MANY-TO-MANY RELATIONSHIP GETTERS
    // =============================================================================
    
    // Get team members for a specific project
    getTeamMembersByProjectId: (state) => (projectId: number) => {
      const assignments = state.projectAssignments.filter(
        assignment => assignment.projectId === projectId && !assignment.unassignedAt
      )
      
      return assignments.map(assignment => {
        const teamMember = state.teamMembers.find(member => member.id === assignment.teamMemberId)
        return {
          ...teamMember!,
          // Include assignment metadata
          assignmentId: assignment.id,
          role: assignment.role,
          hourlyRate: assignment.hourlyRate,
          assignedAt: assignment.assignedAt,
          isLead: assignment.isLead
        }
      })
    },

    // Get projects for a specific team member
    getProjectsByTeamMemberId: (state) => (teamMemberId: number) => {
      const assignments = state.projectAssignments.filter(
        assignment => assignment.teamMemberId === teamMemberId && !assignment.unassignedAt
      )
      
      return assignments.map(assignment => {
        const project = state.projects.find(project => project.id === assignment.projectId)
        return {
          ...project!,
          // Include assignment metadata
          assignmentId: assignment.id,
          role: assignment.role,
          hourlyRate: assignment.hourlyRate,
          assignedAt: assignment.assignedAt,
          isLead: assignment.isLead
        }
      })
    },

    // Get project lead for a specific project
    getProjectLead: (state) => (projectId: number) => {
      const leadAssignment = state.projectAssignments.find(
        assignment => assignment.projectId === projectId && assignment.isLead && !assignment.unassignedAt
      )
      
      if (!leadAssignment) return undefined
      
      const teamMember = state.teamMembers.find(member => member.id === leadAssignment.teamMemberId)
      return teamMember ? {
        ...teamMember,
        assignmentId: leadAssignment.id,
        role: leadAssignment.role,
        assignedAt: leadAssignment.assignedAt
      } : undefined
    },

    // Enhanced getters with full relationship data
    getProjectWithTeam: (state) => (projectId: number) => {
      const project = state.projects.find(p => p.id === projectId)
      if (!project) return undefined
      
      const assignments = state.projectAssignments.filter(
        a => a.projectId === projectId && !a.unassignedAt
      )
      
      const teamMembers = assignments.map(assignment => {
        const member = state.teamMembers.find(m => m.id === assignment.teamMemberId)
        return {
          ...member!,
          assignmentId: assignment.id,
          role: assignment.role,
          hourlyRate: assignment.hourlyRate,
          assignedAt: assignment.assignedAt,
          isLead: assignment.isLead
        }
      })
      
      const projectLead = teamMembers.find(member => member.isLead)
      
      return {
        ...project,
        teamMembers,
        projectLead,
        teamSize: teamMembers.length,
        totalBudgetAllocated: assignments.reduce((sum, a) => sum + a.hourlyRate, 0)
      }
    },

    // Statistics
    totalProjects: (state): number => state.projects.length,
    totalTeamMembers: (state): number => state.teamMembers.length,
    totalAssignments: (state): number => state.projectAssignments.filter(a => !a.unassignedAt).length,

    projectsWithoutLead: (state): Project[] => {
      return state.projects.filter(project => 
        !state.projectAssignments.some(assignment => 
          assignment.projectId === project.id && assignment.isLead && !assignment.unassignedAt
        )
      )
    },

    unassignedTeamMembers: (state): TeamMember[] => {
      const assignedMemberIds = new Set(
        state.projectAssignments
          .filter(a => !a.unassignedAt)
          .map(a => a.teamMemberId)
      )
      
      return state.teamMembers.filter(member => 
        member.isActive && !assignedMemberIds.has(member.id)
      )
    }
  },

  // =============================================================================
  // ACTIONS
  // =============================================================================
  
  actions: {
    // =============================================================================
    // PROJECT CRUD OPERATIONS
    // =============================================================================
    
    async addProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
      try {
        this.loading = true
        this.error = null
        
        const newProject: Project = {
          ...projectData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        this.projects.push(newProject)
        this.lastUpdated = new Date()
        
        return { success: true, data: newProject }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to add project'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async removeProject(projectId: number) {
      try {
        this.loading = true
        this.error = null
        
        const projectExists = this.projects.some(p => p.id === projectId)
        if (!projectExists) {
          throw new Error(`Project with ID ${projectId} not found`)
        }
        
        // Remove project
        this.projects = this.projects.filter(p => p.id !== projectId)
        
        // CASCADE DELETE: Remove all project assignments
        if (RELATIONSHIPS.PROJECT_TEAM_MEMBERS.cascadeDelete) {
          this.projectAssignments = cascadeDelete(
            this.projectAssignments,
            RELATIONSHIPS.PROJECT_TEAM_MEMBERS.foreignKeyA,
            projectId
          )
        }
        
        this.lastUpdated = new Date()
        return { success: true }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to remove project'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // =============================================================================
    // TEAM MEMBER CRUD OPERATIONS
    // =============================================================================
    
    async addTeamMember(memberData: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) {
      try {
        this.loading = true
        this.error = null
        
        const newMember: TeamMember = {
          ...memberData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        this.teamMembers.push(newMember)
        this.lastUpdated = new Date()
        
        return { success: true, data: newMember }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to add team member'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async removeTeamMember(memberId: number) {
      try {
        this.loading = true
        this.error = null
        
        const memberExists = this.teamMembers.some(m => m.id === memberId)
        if (!memberExists) {
          throw new Error(`Team member with ID ${memberId} not found`)
        }
        
        // Remove team member
        this.teamMembers = this.teamMembers.filter(m => m.id !== memberId)
        
        // CASCADE DELETE: Remove all assignments for this team member
        if (RELATIONSHIPS.PROJECT_TEAM_MEMBERS.cascadeDelete) {
          this.projectAssignments = cascadeDelete(
            this.projectAssignments,
            RELATIONSHIPS.PROJECT_TEAM_MEMBERS.foreignKeyB,
            memberId
          )
        }
        
        this.lastUpdated = new Date()
        return { success: true }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to remove team member'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // =============================================================================
    // MANY-TO-MANY RELATIONSHIP OPERATIONS
    // =============================================================================
    
    async assignTeamMemberToProject(
      projectId: number, 
      teamMemberId: number, 
      assignmentData: {
        role: string
        hourlyRate: number
        isLead?: boolean
      }
    ) {
      try {
        this.loading = true
        this.error = null
        
        // FOREIGN KEY VALIDATION
        validateForeignKey(this.projects, projectId, 'Project')
        validateForeignKey(this.teamMembers, teamMemberId, 'TeamMember')
        
        // Check if assignment already exists
        const existingAssignment = this.projectAssignments.find(
          assignment => 
            assignment.projectId === projectId && 
            assignment.teamMemberId === teamMemberId &&
            !assignment.unassignedAt
        )
        
        if (existingAssignment) {
          throw new Error('Team member is already assigned to this project')
        }
        
        // If this is a lead assignment, remove lead status from other assignments
        if (assignmentData.isLead) {
          this.projectAssignments.forEach(assignment => {
            if (assignment.projectId === projectId && assignment.isLead) {
              assignment.isLead = false
              assignment.updatedAt = new Date()
            }
          })
        }
        
        const newAssignment: ProjectAssignment = {
          id: generateId(),
          projectId,
          teamMemberId,
          role: assignmentData.role,
          hourlyRate: assignmentData.hourlyRate,
          isLead: assignmentData.isLead || false,
          assignedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        this.projectAssignments.push(newAssignment)
        this.lastUpdated = new Date()
        
        return { success: true, data: newAssignment }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to assign team member'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async unassignTeamMemberFromProject(projectId: number, teamMemberId: number) {
      try {
        this.loading = true
        this.error = null
        
        const assignment = this.projectAssignments.find(
          a => a.projectId === projectId && a.teamMemberId === teamMemberId && !a.unassignedAt
        )
        
        if (!assignment) {
          throw new Error('Assignment not found')
        }
        
        // Mark as unassigned instead of deleting (for audit trail)
        assignment.unassignedAt = new Date()
        assignment.updatedAt = new Date()
        
        this.lastUpdated = new Date()
        return { success: true, data: assignment }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to unassign team member'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async setProjectLead(projectId: number, teamMemberId: number) {
      try {
        this.loading = true
        this.error = null
        
        // Validate that the team member is assigned to this project
        const assignment = this.projectAssignments.find(
          a => a.projectId === projectId && a.teamMemberId === teamMemberId && !a.unassignedAt
        )
        
        if (!assignment) {
          throw new Error('Team member is not assigned to this project')
        }
        
        // Remove lead status from all other assignments for this project
        this.projectAssignments.forEach(a => {
          if (a.projectId === projectId && a.id !== assignment.id) {
            a.isLead = false
            a.updatedAt = new Date()
          }
        })
        
        // Set this assignment as lead
        assignment.isLead = true
        assignment.updatedAt = new Date()
        
        this.lastUpdated = new Date()
        return { success: true, data: assignment }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to set project lead'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // =============================================================================
    // UTILITY ACTIONS
    // =============================================================================
    
    clearError() {
      this.error = null
    },

    resetStore() {
      this.projects = []
      this.teamMembers = []
      this.projectAssignments = []
      this.loading = false
      this.error = null
      this.lastUpdated = null
    }
  }
}) 