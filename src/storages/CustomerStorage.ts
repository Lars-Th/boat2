import { defineStore } from 'pinia'
import type { 
  BaseEntity, 
  BaseStoreState
} from './baseTypes'
import { 
  validateForeignKey, 
  cascadeDelete, 
  generateId 
} from './baseTypes'
import customersData from './customers.json'

// =============================================================================
// ENTITY INTERFACES
// =============================================================================

export interface Customer extends BaseEntity {
  id: number
  city: string
  companyName: string
  status: 'Aktiv' | 'Inaktiv'
  // Detailed customer fields
  customerNumber: string
  organizationNumber: string
  referenceNumber: string
  streetAddress: string
  postalCode: string
  country: string
  billingStreetAddress: string
  billingPostalCode: string
  billingCity: string
  billingCountry: string
  switchboardNumber: string
  companyEmail: string
  website: string
  companyNotes: string
  companyType: 'Kund' | 'Leverantör' | 'ÅF' | 'Prospect'
}

// =============================================================================
// STORE INTERFACES
// =============================================================================

interface CustomerStoreState extends BaseStoreState {
  customers: Customer[]
}

// =============================================================================
// STORE DEFINITION
// =============================================================================

export const useCustomerStorage = defineStore('Customer', {
  state: (): CustomerStoreState => ({
    customers: customersData.map(customer => ({
      ...customer,
      createdAt: new Date(),
      updatedAt: new Date()
    })) as Customer[],
    loading: false,
    error: null,
    lastUpdated: null
  }),

  // =============================================================================
  // GETTERS
  // =============================================================================
  
  getters: {
    // Basic entity getters
    getCustomerById: (state) => (id: number): Customer | undefined => 
      state.customers.find(customer => customer.id === id),

    // Status-based getters
    activeCustomers: (state): Customer[] => 
      state.customers.filter(customer => customer.status === 'Aktiv'),
    
    inactiveCustomers: (state): Customer[] => 
      state.customers.filter(customer => customer.status === 'Inaktiv'),

    // Type-based getters
    customersByType: (state) => (type: Customer['companyType']): Customer[] =>
      state.customers.filter(customer => customer.companyType === type),

    // Statistics
    totalCustomers: (state): number => state.customers.length,

    // Search and filter getters
    getCustomersByCity: (state) => (city: string): Customer[] =>
      state.customers.filter(customer => 
        customer.city.toLowerCase().includes(city.toLowerCase())
      ),

    getCustomersByName: (state) => (name: string): Customer[] =>
      state.customers.filter(customer => 
        customer.companyName.toLowerCase().includes(name.toLowerCase())
      ),

    searchCustomers: (state) => (query: string): Customer[] => {
      const lowerQuery = query.toLowerCase()
      return state.customers.filter(customer => 
        customer.companyName.toLowerCase().includes(lowerQuery) ||
        customer.city.toLowerCase().includes(lowerQuery) ||
        customer.customerNumber.toLowerCase().includes(lowerQuery) ||
        customer.organizationNumber.toLowerCase().includes(lowerQuery)
      )
    }
  },

  // =============================================================================
  // ACTIONS
  // =============================================================================
  
  actions: {
    // =============================================================================
    // CUSTOMER CRUD OPERATIONS
    // =============================================================================
    
    async addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) {
      try {
        this.loading = true
        this.error = null

        const newCustomer: Customer = {
          ...customerData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }

        this.customers.push(newCustomer)
        this.lastUpdated = new Date()

        return { success: true, data: newCustomer }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        this.error = `Failed to add customer: ${errorMessage}`
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    async updateCustomer(updatedCustomer: Customer) {
      try {
        this.loading = true
        this.error = null

        const index = this.customers.findIndex(c => c.id === updatedCustomer.id)
        if (index === -1) {
          throw new Error(`Customer with id ${updatedCustomer.id} not found`)
        }

        this.customers[index] = {
          ...updatedCustomer,
          updatedAt: new Date()
        }
        this.lastUpdated = new Date()

        return { success: true, data: this.customers[index] }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        this.error = `Failed to update customer: ${errorMessage}`
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    async removeCustomer(customerId: number) {
      try {
        this.loading = true
        this.error = null

        const customerIndex = this.customers.findIndex(c => c.id === customerId)
        if (customerIndex === -1) {
          throw new Error(`Customer with id ${customerId} not found`)
        }

        this.customers.splice(customerIndex, 1)
        this.lastUpdated = new Date()

        return { success: true }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        this.error = `Failed to remove customer: ${errorMessage}`
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // =============================================================================
    // DATA FETCHING
    // =============================================================================

    async fetchCustomers(): Promise<void> {
      try {
        this.loading = true
        this.error = null
        
        // TODO: Replace with actual API call
        // const response = await axios.get('/api/customers')
        // this.customers = response.data
        
        // For now, data is already loaded from JSON file
        this.lastUpdated = new Date()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        this.error = `Failed to fetch customers: ${errorMessage}`
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
      this.customers = customersData.map(customer => ({
        ...customer,
        createdAt: new Date(),
        updatedAt: new Date()
      })) as Customer[]
      this.loading = false
      this.error = null
      this.lastUpdated = null
    }
  }
}) 