import type { ApiResponse } from '../client/types';
import type { Activity, ActivityType, Attendance, Contact, Customer, Participant } from '@/types';
import type {
  ActivityWithParticipants,
  ActivityWithRelations,
  ActivityWithTypes,
  ParticipantWithActivities,
  ParticipantWithFamily,
  ParticipantWithRelations,
  RelationalParams,
} from '@/types/enhanced';
import type {
  ContactWithRelations,
  CustomerWithRelations,
  WorkOrderWithRelations,
} from '@/types/relationships';

// Import JSON data
import activitiesData from '@/assets/data/activities.json';
import activityTypesData from '@/assets/data/activityTypes.json';
import organizationSettingsData from '@/assets/data/organizationSettings.json';
import usersData from '@/assets/data/users.json';
import participantsData from '@/assets/data/participants.json';
import participantGroupsData from '@/assets/data/participantGroups.json';
import attendancesData from '@/assets/data/attendances.json';
import activityTemplatesData from '@/assets/data/activityTemplates.json';
import workOrdersData from '@/assets/data/workOrders.json';
import customersData from '@/assets/data/customers.json';
import contactsData from '@/assets/data/contacts.json';
import machinesData from '@/assets/data/machines.json';
import tasksData from '@/assets/data/tasks.json';
import toolsData from '@/assets/data/tools.json';
import employeesData from '@/assets/data/employees.json';
import familyRelationsData from '@/assets/data/familyRelations.json';
import boatsData from '@/assets/data/boats.json';
import permissionGroupsData from '@/assets/data/permissionGroups.json';

export class MockDataService {
  private delay = 300; // Simulate network delay

  private async simulateNetworkDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
  }

  private async mockRequest<T>(data: T): Promise<ApiResponse<T>> {
    await this.simulateNetworkDelay();

    // Simulate occasional network errors (0.005% chance)
    if (Math.random() < 0.00005) {
      return {
        data: null as T,
        success: false,
        error: {
          message: 'Simulated network error',
          code: 'NETWORK_ERROR',
        },
      };
    }

    return {
      data,
      success: true,
      message: 'Request successful',
    };
  }

  // Shared permission mapping function
  private getPermissionRole(permissionID: number): string {
    const group = permissionGroupsData.find(pg => pg.id === permissionID);
    if (!group) return 'Handläggare';

    // Map permission group names to expected role names for the router
    const roleMapping: { [key: string]: string } = {
      Administratör: 'Administratör',
      'Full tillgång till dokument': 'Enhetsansvarig',
      'Tillgång till dokument': 'Handläggare',
      Versamhetsanvändare: 'Handläggare',
    };

    return roleMapping[group.name] ?? 'Handläggare';
  }

  // Activities with relational support
  async getActivities(
    params?: RelationalParams
  ): Promise<
    ApiResponse<
      Activity[] | ActivityWithTypes[] | ActivityWithParticipants[] | ActivityWithRelations[]
    >
  > {
    const activities = activitiesData as Activity[];

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(activities);
    }

    const enhancedActivities = activities.map(activity => {
      const enhanced = { ...activity } as any;

      if (params.include?.includes('types')) {
        const activityType = (activityTypesData as unknown as ActivityType[]).find(
          type => type.ActivityTypeID === activity.ActivityTypeID
        );
        enhanced.activityType = activityType;
      }

      if (params.include?.includes('participants')) {
        const activityAttendances = attendancesData.filter(
          a => a.ActivityID === activity.ActivityID
        );
        const participantIds = activityAttendances.map(a => a.ParticipantID);
        const activityParticipants = participantsData.filter(p =>
          participantIds.includes(p.ParticipantID)
        );
        enhanced.participants = activityParticipants as Participant[];
      }

      if (params.include?.includes('attendances')) {
        const activityAttendances = attendancesData.filter(
          a => a.ActivityID === activity.ActivityID
        );
        enhanced.attendances = activityAttendances as Attendance[];
      }

      return enhanced;
    });

    return this.mockRequest(enhancedActivities);
  }

  async getActivity(
    id: string,
    params?: RelationalParams
  ): Promise<
    ApiResponse<
      Activity | ActivityWithTypes | ActivityWithParticipants | ActivityWithRelations | null
    >
  > {
    const activity = activitiesData.find(a => a.ActivityID === parseInt(id));
    if (!activity) {
      return this.mockRequest(null);
    }

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(activity as Activity);
    }

    const enhanced = { ...activity } as any;

    if (params.include?.includes('types')) {
      const activityType = (activityTypesData as unknown as ActivityType[]).find(
        type => type.ActivityTypeID === activity.ActivityTypeID
      );
      enhanced.activityType = activityType;
    }

    if (params.include?.includes('participants')) {
      const activityAttendances = attendancesData.filter(a => a.ActivityID === activity.ActivityID);
      const participantIds = activityAttendances.map(a => a.ParticipantID);
      const activityParticipants = participantsData.filter(p =>
        participantIds.includes(p.ParticipantID)
      );
      enhanced.participants = activityParticipants as Participant[];
    }

    if (params.include?.includes('attendances')) {
      const activityAttendances = attendancesData.filter(a => a.ActivityID === activity.ActivityID);
      enhanced.attendances = activityAttendances as Attendance[];
    }

    return this.mockRequest(enhanced);
  }

  async createActivity(activity: Partial<Activity>): Promise<ApiResponse<Activity>> {
    const newActivity = {
      ...activity,
      ActivityID: Math.max(...activitiesData.map(a => a.ActivityID)) + 1,
      DatumTid: activity.DatumTid ?? new Date().toISOString(),
    } as Activity;

    return this.mockRequest(newActivity);
  }

  async updateActivity(id: string, activity: Partial<Activity>): Promise<ApiResponse<Activity>> {
    const existingActivityIndex = activitiesData.findIndex(a => a.ActivityID === parseInt(id));
    if (existingActivityIndex === -1) {
      return {
        data: null as unknown as Activity,
        success: false,
        error: {
          message: 'Activity not found',
          code: 'NOT_FOUND',
        },
      };
    }

    const existingActivity = activitiesData[existingActivityIndex]!;
    const updatedActivity = {
      ...existingActivity,
      ...activity,
      // Ensure required fields are properly handled
      Beskrivning: activity.Beskrivning ?? existingActivity.Beskrivning ?? '',
      Plats: activity.Plats ?? existingActivity.Plats ?? '',
    };

    // Actually update the data in the mock data array
    (activitiesData as any)[existingActivityIndex] = updatedActivity;

    return this.mockRequest(updatedActivity as Activity);
  }

  async deleteActivity(id: string): Promise<ApiResponse<boolean>> {
    const activityIndex = activitiesData.findIndex(a => a.ActivityID === parseInt(id));
    if (activityIndex === -1) {
      return {
        data: false,
        success: false,
        error: {
          message: 'Activity not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Actually remove the activity from the data array
    activitiesData.splice(activityIndex, 1);

    return this.mockRequest(true);
  }

  // Activity Types
  async getActivityTypes(): Promise<ApiResponse<ActivityType[]>> {
    return this.mockRequest(activityTypesData as unknown as ActivityType[]);
  }

  // Organizations
  async getOrganizations(): Promise<ApiResponse<typeof organizationSettingsData.organizations>> {
    return this.mockRequest(organizationSettingsData.organizations);
  }

  async createOrganization(
    org: Partial<(typeof organizationSettingsData.organizations)[0]>
  ): Promise<ApiResponse<(typeof organizationSettingsData.organizations)[0]>> {
    const newOrg = {
      ...org,
      id: (
        Math.max(...organizationSettingsData.organizations.map(o => parseInt(o.id))) + 1
      ).toString(),
      skapadDatum: new Date().toISOString(),
    } as unknown as (typeof organizationSettingsData.organizations)[0];

    return this.mockRequest(newOrg);
  }

  async updateOrganization(
    id: string,
    org: Partial<(typeof organizationSettingsData.organizations)[0]>
  ): Promise<ApiResponse<(typeof organizationSettingsData.organizations)[0]>> {
    const existingOrg = organizationSettingsData.organizations.find(o => o.id === id);
    if (!existingOrg) {
      return {
        data: null as unknown as (typeof organizationSettingsData.organizations)[0],
        success: false,
        error: {
          message: 'Organization not found',
          code: 'NOT_FOUND',
        },
      };
    }

    const updatedOrg = { ...existingOrg, ...org };
    return this.mockRequest(updatedOrg);
  }

  async deleteOrganization(id: string): Promise<ApiResponse<boolean>> {
    const exists = organizationSettingsData.organizations.some(o => o.id === id);
    if (!exists) {
      return {
        data: false,
        success: false,
        error: {
          message: 'Organization not found',
          code: 'NOT_FOUND',
        },
      };
    }

    return this.mockRequest(true);
  }

  // Users
  async getUsers(params?: RelationalParams): Promise<ApiResponse<any[]>> {
    const users = usersData as any[];

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(users);
    }

    const enhancedUsers = users.map(user => {
      const enhanced: any = { ...user };

      if (params.include?.includes('permissionGroup')) {
        const permissionGroup = permissionGroupsData.find(pg => pg.id === user.permissionID);
        enhanced.permissionGroup = permissionGroup;
      }

      return enhanced;
    });

    return this.mockRequest(enhancedUsers);
  }

  async getUser(id: string, params?: RelationalParams): Promise<ApiResponse<any | null>> {
    const user = usersData.find(u => u.id === parseInt(id));
    if (!user) {
      return this.mockRequest(null);
    }

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(user);
    }

    const enhanced: any = { ...user };

    if (params.include?.includes('permissionGroup')) {
      const permissionGroup = permissionGroupsData.find(pg => pg.id === user.permissionID);
      enhanced.permissionGroup = permissionGroup;
    }

    return this.mockRequest(enhanced);
  }

  async createUser(
    user: Partial<(typeof usersData)[0]>
  ): Promise<ApiResponse<(typeof usersData)[0]>> {
    const newUser = {
      ...user,
      id: Math.max(...usersData.map(u => u.id)) + 1,
    } as unknown as (typeof usersData)[0];

    return this.mockRequest(newUser);
  }

  async updateUser(
    id: string,
    user: Partial<(typeof usersData)[0]>
  ): Promise<ApiResponse<(typeof usersData)[0]>> {
    const existingUserIndex = usersData.findIndex(u => u.id === parseInt(id));
    if (existingUserIndex === -1) {
      return {
        data: null as unknown as (typeof usersData)[0],
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      };
    }

    const existingUser = usersData[existingUserIndex]!;
    const updatedUser = {
      ...existingUser,
      ...user,
      // Ensure required fields are not undefined
      name: user.name ?? existingUser.name,
      email: user.email ?? existingUser.email,
      permissionID: user.permissionID ?? existingUser.permissionID,
    } as (typeof usersData)[0];

    // Actually update the data in the mock data array
    usersData[existingUserIndex] = updatedUser;

    return this.mockRequest(updatedUser);
  }

  async deleteUser(id: string): Promise<ApiResponse<boolean>> {
    const exists = usersData.some(u => u.id === parseInt(id));
    if (!exists) {
      return {
        data: false,
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      };
    }

    return this.mockRequest(true);
  }

  async updateUserPassword(id: string, newPassword: string): Promise<ApiResponse<boolean>> {
    const existingUserIndex = usersData.findIndex(u => u.id === parseInt(id));
    if (existingUserIndex === -1) {
      return {
        data: false,
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Update the password in the mock data array
    usersData[existingUserIndex]!.password = newPassword;

    return this.mockRequest(true);
  }

  // Participants with relational support
  async getParticipants(
    params?: RelationalParams
  ): Promise<
    ApiResponse<
      | Participant[]
      | ParticipantWithActivities[]
      | ParticipantWithFamily[]
      | ParticipantWithRelations[]
    >
  > {
    const participants = participantsData as Participant[];

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(participants);
    }

    const enhancedParticipants = participants.map(participant => {
      const enhanced: any = { ...participant };

      if (params.include?.includes('activities')) {
        const participantAttendances = attendancesData.filter(
          a => a.ParticipantID === participant.ParticipantID
        );
        const activityIds = participantAttendances.map(a => a.ActivityID);
        const participantActivities = activitiesData.filter(activity =>
          activityIds.includes(activity.ActivityID)
        );
        enhanced.activities = participantActivities as Activity[];
      }

      if (params.include?.includes('family')) {
        // Load family relations from familyRelations.json
        const participantFamilyRelations = familyRelationsData.filter(
          relation =>
            relation.ParticipantID === participant.ParticipantID ||
            relation.RelatedParticipantID === participant.ParticipantID
        );

        const familyMembers = participantFamilyRelations
          .map(relation => {
            const relatedParticipantId =
              relation.ParticipantID === participant.ParticipantID
                ? relation.RelatedParticipantID
                : relation.ParticipantID;

            const relatedParticipant = participants.find(
              p => p.ParticipantID === relatedParticipantId
            );

            if (relatedParticipant) {
              return {
                ...relatedParticipant,
                RelationType: relation.RelationType,
                RelationID: relation.RelationID,
              };
            }
            return null;
          })
          .filter(Boolean);

        enhanced.family = familyMembers;
      }

      if (params.include?.includes('attendances')) {
        const participantAttendances = attendancesData.filter(
          a => a.ParticipantID === participant.ParticipantID
        );
        enhanced.attendances = participantAttendances as Attendance[];
      }

      return enhanced;
    });

    return this.mockRequest(enhancedParticipants);
  }

  async getParticipant(
    id: string,
    params?: RelationalParams
  ): Promise<
    ApiResponse<
      | Participant
      | ParticipantWithActivities
      | ParticipantWithFamily
      | ParticipantWithRelations
      | null
    >
  > {
    const participant = participantsData.find(p => p.ParticipantID === parseInt(id));
    if (!participant) {
      return this.mockRequest(null);
    }

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(participant as Participant);
    }

    const enhanced: any = { ...participant };

    if (params.include?.includes('activities')) {
      const participantAttendances = attendancesData.filter(
        a => a.ParticipantID === participant.ParticipantID
      );
      const activityIds = participantAttendances.map(a => a.ActivityID);
      const participantActivities = activitiesData.filter(activity =>
        activityIds.includes(activity.ActivityID)
      );
      enhanced.activities = participantActivities as Activity[];
    }

    if (params.include?.includes('family')) {
      // Load family relations from familyRelations.json
      const participantFamilyRelations = familyRelationsData.filter(
        relation =>
          relation.ParticipantID === participant.ParticipantID ||
          relation.RelatedParticipantID === participant.ParticipantID
      );

      const familyMembers = participantFamilyRelations
        .map(relation => {
          const relatedParticipantId =
            relation.ParticipantID === participant.ParticipantID
              ? relation.RelatedParticipantID
              : relation.ParticipantID;

          const relatedParticipant = participantsData.find(
            p => p.ParticipantID === relatedParticipantId
          );

          if (relatedParticipant) {
            return {
              ...relatedParticipant,
              RelationType: relation.RelationType,
              RelationID: relation.RelationID,
            };
          }
          return null;
        })
        .filter(Boolean);

      enhanced.family = familyMembers;
    }

    if (params.include?.includes('attendances')) {
      const participantAttendances = attendancesData.filter(
        a => a.ParticipantID === participant.ParticipantID
      );
      enhanced.attendances = participantAttendances as Attendance[];
    }

    return this.mockRequest(enhanced);
  }

  // Participant Groups
  async getParticipantGroups(): Promise<ApiResponse<typeof participantGroupsData>> {
    return this.mockRequest(participantGroupsData);
  }

  // Attendances
  async getAttendances(): Promise<ApiResponse<typeof attendancesData>> {
    return this.mockRequest(attendancesData);
  }

  async getAttendancesByActivityId(activityId: string): Promise<ApiResponse<Attendance[]>> {
    const activityAttendances = attendancesData.filter(a => a.ActivityID === parseInt(activityId));
    return this.mockRequest(activityAttendances as Attendance[]);
  }

  async createAttendance(attendance: Partial<Attendance>): Promise<ApiResponse<Attendance>> {
    const newAttendance = {
      ...attendance,
      AttendanceID: Math.max(...attendancesData.map(a => a.AttendanceID)) + 1,
      DatumTid: attendance.DatumTid ?? new Date().toISOString(),
    } as Attendance;

    return this.mockRequest(newAttendance);
  }

  async getParticipantsByActivityId(activityId: string): Promise<ApiResponse<Participant[]>> {
    const activityAttendances = attendancesData.filter(a => a.ActivityID === parseInt(activityId));
    const participantIds = activityAttendances.map(a => a.ParticipantID);
    const activityParticipants = participantsData.filter(p =>
      participantIds.includes(p.ParticipantID)
    );
    return this.mockRequest(activityParticipants as Participant[]);
  }

  // Activity Templates
  async getActivityTemplates(): Promise<ApiResponse<typeof activityTemplatesData>> {
    return this.mockRequest(activityTemplatesData);
  }

  async getActivityTemplate(
    id: string
  ): Promise<ApiResponse<(typeof activityTemplatesData)[0] | null>> {
    const template = activityTemplatesData.find(t => t.id === id);
    return this.mockRequest(template ?? null);
  }

  // Work Orders with enhanced relational support and computed fields
  async getWorkOrders(params?: RelationalParams): Promise<ApiResponse<WorkOrderWithRelations[]>> {
    const workOrders = workOrdersData as unknown as WorkOrderWithRelations[];

    const enhancedWorkOrders = workOrders.map(workOrder => {
      const enhanced = { ...workOrder } as WorkOrderWithRelations;

      // Get all tasks for this work order
      const workOrderTasks = tasksData.filter(task => task.WorkOrderID === workOrder.WorkOrderID);

      // Compute ActualHours from all tasks
      enhanced.ActualHours = workOrderTasks.reduce((total, task) => total + (task.Hours ?? 0), 0);

      // Add basic relations if requested
      if (params?.include?.includes('customer')) {
        const customer = customersData.find(c => c.CustomerID === workOrder.CustomerID);
        enhanced.customer = customer as CustomerWithRelations;
      }

      if (params?.include?.includes('createdBy')) {
        const createdByUser = usersData.find(u => u.id === (workOrder as any).CreatedBy);
        (enhanced as any).createdByUser = createdByUser;
      }

      if (params?.include?.includes('tasks')) {
        // Enhance tasks with employee information
        const enhancedTasks = workOrderTasks.map(task => {
          const employee = employeesData.find(e => e.id === (task as any).EmployeeID);
          return {
            ...task,
            employee,
          };
        });
        (enhanced as any).tasks = enhancedTasks;
      }

      if (params?.include?.includes('contact')) {
        const contact = contactsData.find(c => c.ContactID === workOrder.ContactPersonID);
        enhanced.contact = contact as ContactWithRelations;
      }

      if (params?.include?.includes('assignedEmployee')) {
        // Find employee by ID from AssignedTo field
        const assignedEmployee = employeesData.find(e => e.id === Number(workOrder.AssignedTo));
        (enhanced as any).assignedEmployee = assignedEmployee;
      }

      if (params?.include?.includes('assignedUsers')) {
        // Handle assignedUsers relationship - convert single AssignedTo to array
        const assignedUsers = [];
        if (workOrder.AssignedTo) {
          const assignedEmployee = employeesData.find(e => e.id === Number(workOrder.AssignedTo));
          if (assignedEmployee) {
            // Split name into FirstName and LastName for template compatibility
            const nameParts = assignedEmployee.name.split(' ');
            const enhancedEmployee = {
              ...assignedEmployee,
              FirstName: nameParts[0] ?? '',
              LastName: nameParts.slice(1).join(' ') ?? '',
            };
            assignedUsers.push(enhancedEmployee);
          }
        }
        enhanced.assignedUsers = assignedUsers;
      }

      if (params?.include?.includes('attestedBy')) {
        // Handle attestedBy relationship - get user who attested the work order
        if ((workOrder as any).AttestedBy) {
          const attestedByUser = usersData.find(u => u.id === (workOrder as any).AttestedBy);
          (enhanced as any).attestedBy = attestedByUser;
        }
      }

      return enhanced;
    });

    return this.mockRequest(enhancedWorkOrders);
  }

  async getWorkOrder(id: string, params?: RelationalParams): Promise<ApiResponse<any | null>> {
    const workOrder = workOrdersData.find(wo => wo.WorkOrderID === parseInt(id));
    if (!workOrder) {
      return this.mockRequest(null);
    }

    const enhanced: any = { ...workOrder };

    // Get all tasks for this work order
    const workOrderTasks = tasksData.filter(task => task.WorkOrderID === workOrder.WorkOrderID);

    // Compute ActualHours from all tasks
    enhanced.ActualHours = workOrderTasks.reduce((total, task) => total + task.Hours, 0);

    // Add basic relations if requested
    if (params?.include?.includes('customer')) {
      const customer = customersData.find(c => c.CustomerID === workOrder.CustomerID);
      enhanced.customer = customer;
    }

    if (params?.include?.includes('createdBy')) {
      const createdByUser = usersData.find(u => u.id === (workOrder as any).CreatedBy);
      enhanced.createdByUser = createdByUser;
    }

    if (params?.include?.includes('tasks')) {
      // Enhance tasks with employee information
      const enhancedTasks = workOrderTasks.map(task => {
        const employee = employeesData.find(e => e.id === (task as any).EmployeeID);
        return {
          ...task,
          employee,
        };
      });
      enhanced.tasks = enhancedTasks;
    }

    if (params?.include?.includes('contact')) {
      const contact = contactsData.find(c => c.ContactID === workOrder.ContactPersonID);
      enhanced.contact = contact;
    }

    if (params?.include?.includes('assignedEmployee')) {
      // Find employee by ID from AssignedTo field
      const assignedEmployee = employeesData.find(e => e.id === Number(workOrder.AssignedTo));
      enhanced.assignedEmployee = assignedEmployee;
    }

    if (params?.include?.includes('assignedUsers')) {
      // Handle assignedUsers relationship - convert single AssignedTo to array
      const assignedUsers = [];
      if (workOrder.AssignedTo) {
        const assignedEmployee = employeesData.find(e => e.id === Number(workOrder.AssignedTo));
        if (assignedEmployee) {
          // Split name into FirstName and LastName for template compatibility
          const nameParts = assignedEmployee.name.split(' ');
          const enhancedEmployee = {
            ...assignedEmployee,
            FirstName: nameParts.length > 0 ? nameParts[0] : '',
            LastName: nameParts.slice(1).join(' ') || '',
          };
          assignedUsers.push(enhancedEmployee);
        }
      }
      enhanced.assignedUsers = assignedUsers;
    }

    if (params?.include?.includes('attestedBy')) {
      // Handle attestedBy relationship - get user who attested the work order
      if ((workOrder as any).AttestedBy) {
        const attestedByUser = usersData.find(u => u.id === (workOrder as any).AttestedBy);
        enhanced.attestedBy = attestedByUser;
      }
    }

    return this.mockRequest(enhanced);
  }

  // Customers
  async getCustomers(
    params?: RelationalParams
  ): Promise<ApiResponse<Customer[] | CustomerWithRelations[]>> {
    const customers = customersData as Customer[];

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(customers);
    }

    // Handle relationship loading
    const enhancedCustomers = customers.map(customer => {
      const enhanced: CustomerWithRelations = { ...customer };

      if (params.include?.includes('contacts')) {
        const customerContacts = contactsData.filter(
          c => c.CustomerID === customer.CustomerID
        ) as Contact[];
        enhanced.contacts = customerContacts as ContactWithRelations[];

        // Add computed field - find primary contact
        enhanced.primaryContact = customerContacts.find(
          c => c.IsPrimary === true
        ) as ContactWithRelations;
      }

      if (params.include?.includes('workOrders')) {
        const customerWorkOrders = workOrdersData.filter(
          wo => wo.CustomerID === customer.CustomerID
        );
        enhanced.workOrders = customerWorkOrders as unknown as WorkOrderWithRelations[];

        // Add computed fields
        enhanced.totalWorkOrders = customerWorkOrders.length;
        enhanced.activeWorkOrders = customerWorkOrders.filter(
          wo => wo.Status === 'active' || wo.Status === 'in_progress' || wo.Status === 'pending'
        ).length;
      }

      return enhanced;
    });

    return this.mockRequest(enhancedCustomers);
  }

  async getCustomer(
    id: string,
    params?: RelationalParams
  ): Promise<ApiResponse<Customer | CustomerWithRelations | null>> {
    const customer = customersData.find(c => c.CustomerID === parseInt(id)) as Customer;
    if (!customer) {
      return this.mockRequest(null);
    }

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(customer);
    }

    const enhanced: CustomerWithRelations = { ...customer };

    if (params.include?.includes('contacts')) {
      const customerContacts = contactsData.filter(
        c => c.CustomerID === customer.CustomerID
      ) as Contact[];
      enhanced.contacts = customerContacts as ContactWithRelations[];

      // Add computed field - find primary contact
      enhanced.primaryContact = customerContacts.find(
        c => c.IsPrimary === true
      ) as ContactWithRelations;
    }

    if (params.include?.includes('workOrders')) {
      const customerWorkOrders = workOrdersData.filter(wo => wo.CustomerID === customer.CustomerID);
      enhanced.workOrders = customerWorkOrders as unknown as WorkOrderWithRelations[];

      // Add computed fields
      enhanced.totalWorkOrders = customerWorkOrders.length;
      enhanced.activeWorkOrders = customerWorkOrders.filter(
        wo => wo.Status === 'active' || wo.Status === 'in_progress' || wo.Status === 'pending'
      ).length;
    }

    return this.mockRequest(enhanced);
  }

  async createCustomer(
    data: Omit<Customer, 'CustomerID' | 'CreatedDate'>
  ): Promise<ApiResponse<Customer>> {
    const newCustomer: Customer = {
      ...data,
      CustomerID: Math.max(...customersData.map(c => c.CustomerID)) + 1,
      CreatedDate: new Date().toISOString().split('T')[0],
    } as Customer;

    // Actually add the customer to the array
    (customersData as Customer[]).push(newCustomer);

    return this.mockRequest(newCustomer);
  }

  async updateCustomer(
    id: string,
    data: Partial<Omit<Customer, 'CustomerID' | 'CreatedDate'>>
  ): Promise<ApiResponse<Customer>> {
    const customerIndex = customersData.findIndex(c => c.CustomerID === parseInt(id));
    if (customerIndex === -1) {
      return {
        data: null as unknown as Customer,
        success: false,
        error: {
          message: 'Customer not found',
          code: 'NOT_FOUND',
        },
      };
    }

    const updatedCustomer: Customer = {
      ...(customersData[customerIndex] as Customer),
      ...data,
    };

    // Actually update the customer in the array
    (customersData as Customer[])[customerIndex] = updatedCustomer;

    return this.mockRequest(updatedCustomer);
  }

  async deleteCustomer(id: string): Promise<ApiResponse<boolean>> {
    const customerIndex = customersData.findIndex(c => c.CustomerID === parseInt(id));
    if (customerIndex === -1) {
      return {
        data: false,
        success: false,
        error: {
          message: 'Customer not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Actually remove the customer from the array
    customersData.splice(customerIndex, 1);

    return this.mockRequest(true);
  }

  // Contacts
  async getContacts(
    params?: RelationalParams
  ): Promise<ApiResponse<Contact[] | ContactWithRelations[]>> {
    const contacts = contactsData as Contact[];

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(contacts);
    }

    // Handle relationship loading
    const enhancedContacts = contacts.map(contact => {
      const enhanced: ContactWithRelations = { ...contact };

      if (params.include?.includes('customer')) {
        const customer = customersData.find(c => c.CustomerID === contact.CustomerID);
        enhanced.customer = customer as CustomerWithRelations;
      }

      if (params.include?.includes('workOrders')) {
        const customerWorkOrders = workOrdersData.filter(
          wo => wo.ContactPersonID === contact.ContactID
        );
        enhanced.workOrders = customerWorkOrders as any[];

        // Add computed fields
        enhanced.totalWorkOrders = customerWorkOrders.length;
        enhanced.activeWorkOrders = customerWorkOrders.filter(
          wo => wo.Status === 'in_progress' || wo.Status === 'pending'
        ).length;
      }

      // Always add computed full name
      enhanced.fullName = `${contact.FirstName} ${contact.LastName}`.trim();

      return enhanced;
    });

    return this.mockRequest(enhancedContacts);
  }

  async getContact(
    id: string,
    params?: RelationalParams
  ): Promise<ApiResponse<Contact | ContactWithRelations | null>> {
    const contact = contactsData.find(c => c.ContactID === parseInt(id)) as Contact;
    if (!contact) {
      return this.mockRequest(null);
    }

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(contact);
    }

    const enhanced: ContactWithRelations = { ...contact };

    if (params.include?.includes('customer')) {
      const customer = customersData.find(c => c.CustomerID === contact.CustomerID);
      enhanced.customer = customer as CustomerWithRelations;
    }

    if (params.include?.includes('workOrders')) {
      const customerWorkOrders = workOrdersData.filter(
        wo => wo.ContactPersonID === contact.ContactID
      );
      enhanced.workOrders = customerWorkOrders as any[];

      // Add computed fields
      enhanced.totalWorkOrders = customerWorkOrders.length;
      enhanced.activeWorkOrders = customerWorkOrders.filter(
        wo => wo.Status === 'in_progress' || wo.Status === 'pending'
      ).length;
    }

    // Always add computed full name
    enhanced.fullName = `${contact.FirstName} ${contact.LastName}`.trim();

    return this.mockRequest(enhanced);
  }

  async createContact(data: Omit<Contact, 'ContactID'>): Promise<ApiResponse<Contact>> {
    const newContact: Contact = {
      ...data,
      ContactID: Math.max(...contactsData.map(c => c.ContactID)) + 1,
    };

    // Actually add the contact to the array
    (contactsData as Contact[]).push(newContact);

    return this.mockRequest(newContact);
  }

  async updateContact(
    id: string,
    data: Partial<Omit<Contact, 'ContactID'>>
  ): Promise<ApiResponse<Contact>> {
    const contactIndex = contactsData.findIndex(c => c.ContactID === parseInt(id));
    if (contactIndex === -1) {
      return {
        data: null as unknown as Contact,
        success: false,
        error: {
          message: 'Contact not found',
          code: 'NOT_FOUND',
        },
      };
    }

    const updatedContact: Contact = {
      ...(contactsData[contactIndex] as Contact),
      ...data,
    };

    // Actually update the contact in the array
    (contactsData as Contact[])[contactIndex] = updatedContact;

    return this.mockRequest(updatedContact);
  }

  async deleteContact(id: string): Promise<ApiResponse<boolean>> {
    const contactIndex = contactsData.findIndex(c => c.ContactID === parseInt(id));
    if (contactIndex === -1) {
      return {
        data: false,
        success: false,
        error: {
          message: 'Contact not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Actually remove the contact from the array
    contactsData.splice(contactIndex, 1);

    return this.mockRequest(true);
  }

  // Machines
  async getMachines(params?: RelationalParams): Promise<ApiResponse<any[]>> {
    const machines = machinesData as any[];

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(machines);
    }

    const enhancedMachines = machines.map(machine => {
      const enhanced: any = { ...machine };

      if (params.include?.includes('customer')) {
        const customer = customersData.find(c => c.CustomerID === machine.CustomerID);
        enhanced.customer = customer;
      }

      return enhanced;
    });

    return this.mockRequest(enhancedMachines);
  }

  // Tasks with enhanced relational support
  async getTasks(params?: RelationalParams): Promise<ApiResponse<any[]>> {
    const tasks = tasksData as any[];

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(tasks);
    }

    const enhancedTasks = tasks.map(task => {
      const enhanced: any = { ...task };

      if (params.include?.includes('workOrder')) {
        const workOrder = workOrdersData.find(wo => wo.WorkOrderID === task.WorkOrderID);
        enhanced.workOrder = workOrder;
      }

      if (params.include?.includes('employee')) {
        const employee = employeesData.find(e => e.id === task.EmployeeID);
        enhanced.employee = employee;
      }

      if (params.include?.includes('customer')) {
        const workOrder = workOrdersData.find(wo => wo.WorkOrderID === task.WorkOrderID);
        if (workOrder) {
          const customer = customersData.find(c => c.CustomerID === workOrder.CustomerID);
          enhanced.customer = customer;
        }
      }

      return enhanced;
    });

    return this.mockRequest(enhancedTasks);
  }

  // Tools
  async getTools(): Promise<ApiResponse<typeof toolsData>> {
    return this.mockRequest(toolsData);
  }

  // Update Work Order
  async updateWorkOrder(id: string, updates: Partial<any>): Promise<ApiResponse<any | null>> {
    const workOrderIndex = workOrdersData.findIndex(wo => wo.WorkOrderID === parseInt(id));
    if (workOrderIndex === -1) {
      return this.mockRequest(null);
    }

    // Update the work order
    const updatedWorkOrder = {
      ...workOrdersData[workOrderIndex],
      ...updates,
    };

    workOrdersData[workOrderIndex] = updatedWorkOrder as (typeof workOrdersData)[0];

    return this.mockRequest(updatedWorkOrder);
  }

  // Employees
  async getEmployees(): Promise<ApiResponse<typeof employeesData>> {
    return this.mockRequest(employeesData);
  }

  // Boats
  async getBoats(params?: RelationalParams): Promise<ApiResponse<any[]>> {
    const boats = boatsData as any[];

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(boats);
    }

    const enhancedBoats = boats.map(boat => {
      const enhanced: any = { ...boat };

      if (params.include?.includes('customer')) {
        const customer = customersData.find(c => c.CustomerID === boat.customerId);
        enhanced.customer = customer;
      }

      return enhanced;
    });

    return this.mockRequest(enhancedBoats);
  }

  async getBoat(id: string, params?: RelationalParams): Promise<ApiResponse<any | null>> {
    const boat = boatsData.find(b => b.id === parseInt(id));
    if (!boat) {
      return this.mockRequest(null);
    }

    if (!params?.include || params.include.length === 0) {
      return this.mockRequest(boat);
    }

    const enhanced: any = { ...boat };

    if (params.include?.includes('customer')) {
      const customer = customersData.find(c => c.CustomerID === boat.customerId);
      enhanced.customer = customer;
    }

    return this.mockRequest(enhanced);
  }

  async createBoat(
    data: Partial<(typeof boatsData)[0]>
  ): Promise<ApiResponse<(typeof boatsData)[0]>> {
    const newBoat = {
      ...data,
      id: Math.max(...boatsData.map(b => b.id)) + 1,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    } as unknown as (typeof boatsData)[0];

    // Actually add the boat to the array
    boatsData.push(newBoat);

    return this.mockRequest(newBoat);
  }

  async updateBoat(
    id: string,
    data: Partial<(typeof boatsData)[0]>
  ): Promise<ApiResponse<(typeof boatsData)[0]>> {
    const boatIndex = boatsData.findIndex(b => b.id === parseInt(id));
    if (boatIndex === -1) {
      return {
        data: null as unknown as (typeof boatsData)[0],
        success: false,
        error: {
          message: 'Boat not found',
          code: 'NOT_FOUND',
        },
      };
    }

    const updatedBoat = {
      ...boatsData[boatIndex],
      ...data,
      lastModified: new Date().toISOString(),
    } as unknown as (typeof boatsData)[0];

    // Actually update the boat in the array
    boatsData[boatIndex] = updatedBoat;

    return this.mockRequest(updatedBoat);
  }

  async deleteBoat(id: string): Promise<ApiResponse<boolean>> {
    const boatIndex = boatsData.findIndex(b => b.id === parseInt(id));
    if (boatIndex === -1) {
      return {
        data: false,
        success: false,
        error: {
          message: 'Boat not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Actually remove the boat from the array
    boatsData.splice(boatIndex, 1);

    return this.mockRequest(true);
  }

  // PermissionGroups
  async getPermissionGroups(): Promise<ApiResponse<typeof permissionGroupsData>> {
    return this.mockRequest(permissionGroupsData);
  }

  async getPermissionGroup(
    id: string
  ): Promise<ApiResponse<(typeof permissionGroupsData)[0] | null>> {
    const group = permissionGroupsData.find(g => g.id === parseInt(id));
    return this.mockRequest(group ?? null);
  }

  async createPermissionGroup(
    data: Partial<(typeof permissionGroupsData)[0]>
  ): Promise<ApiResponse<(typeof permissionGroupsData)[0]>> {
    const newGroup = {
      ...data,
      id: Math.max(...permissionGroupsData.map(g => g.id)) + 1,
    } as (typeof permissionGroupsData)[0];

    return this.mockRequest(newGroup);
  }

  async updatePermissionGroup(
    id: string,
    data: Partial<(typeof permissionGroupsData)[0]>
  ): Promise<ApiResponse<(typeof permissionGroupsData)[0]>> {
    const existingGroup = permissionGroupsData.find(g => g.id === parseInt(id));
    if (!existingGroup) {
      return {
        data: null as unknown as (typeof permissionGroupsData)[0],
        success: false,
        error: {
          message: 'Permission group not found',
          code: 'NOT_FOUND',
        },
      };
    }

    const updatedGroup = { ...existingGroup, ...data } as (typeof permissionGroupsData)[0];
    return this.mockRequest(updatedGroup);
  }

  async deletePermissionGroup(id: string): Promise<ApiResponse<boolean>> {
    const exists = permissionGroupsData.some(g => g.id === parseInt(id));
    if (!exists) {
      return {
        data: false,
        success: false,
        error: {
          message: 'Permission group not found',
          code: 'NOT_FOUND',
        },
      };
    }

    return this.mockRequest(true);
  }

  // Authentication
  async login(
    email: string,
    password: string
  ): Promise<
    ApiResponse<{
      user: {
        id: number;
        name: string;
        email: string;
        role: string;
        permissionGroup?: any;
      };
      token?: string;
    }>
  > {
    // Find user in the JSON data
    const user = usersData.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      return {
        data: null as any,
        success: false,
        error: {
          message: 'Felaktigt användarnamn eller lösenord',
          code: 'UNAUTHORIZED',
        },
      };
    }

    // Get permission group for the user
    const permissionGroup = permissionGroupsData.find(pg => pg.id === user.permissionID);

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: this.getPermissionRole(user.permissionID),
      permissionGroup,
    };

    return this.mockRequest({
      user: authUser,
      token: `mock-token-${user.id}-${Date.now()}`, // Mock JWT token
    });
  }

  async logout(): Promise<ApiResponse<boolean>> {
    // In a real API, this would invalidate the token
    return this.mockRequest(true);
  }

  async getCurrentUser(token: string = ''): Promise<
    ApiResponse<{
      id: number;
      name: string;
      email: string;
      role: string;
      permissionGroup?: any;
    } | null>
  > {
    // In a real API, this would validate the token and return user info
    // For mock, we'll just return null if no valid token format
    if (!token.startsWith('mock-token-')) {
      return {
        data: null,
        success: false,
        error: {
          message: 'Invalid or expired token',
          code: 'UNAUTHORIZED',
        },
      };
    }

    // Extract user ID from mock token
    const tokenParts = token.split('-');
    const userId = parseInt(tokenParts[2]);

    const user = usersData.find((u: any) => u.id === userId);
    if (!user) {
      return {
        data: null,
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Get permission group for the user
    const permissionGroup = permissionGroupsData.find(pg => pg.id === user.permissionID);

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: this.getPermissionRole(user.permissionID),
      permissionGroup,
    };

    return this.mockRequest(authUser);
  }

  // Get default user (Lars Thomas - user ID 1) for development
  async getDefaultUser(): Promise<
    ApiResponse<{
      id: number;
      name: string;
      email: string;
      role: string;
      permissionGroup?: any;
    } | null>
  > {
    const user = usersData.find((u: any) => u.id === 1); // Lars Thomas
    if (!user) {
      return {
        data: null,
        success: false,
        error: {
          message: 'Default user not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Get permission group for the user
    const permissionGroup = permissionGroupsData.find(pg => pg.id === user.permissionID);

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: this.getPermissionRole(user.permissionID),
      permissionGroup,
    };

    return this.mockRequest(authUser);
  }

  async getDemoUsers(): Promise<
    ApiResponse<
      Array<{
        id: number;
        name: string;
        email: string;
        role: string;
        type: 'admin' | 'manager' | 'user';
      }>
    >
  > {
    // Use shared permission mapping

    // Get user type based on role
    const getUserType = (permissionID: number): 'admin' | 'manager' | 'user' => {
      switch (permissionID) {
        case 1:
        case 2:
          return 'admin';
        case 4:
          return 'manager';
        default:
          return 'user';
      }
    };

    // Map users to demo format
    const demoUsers = usersData.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: this.getPermissionRole(user.permissionID),
      type: getUserType(user.permissionID),
    }));

    return this.mockRequest(demoUsers);
  }
}
