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

// =============================================================================
// ENTITY INTERFACES
// =============================================================================

const baseURL = "http://localhost:41812/API"; // Replace with your actual backend URL

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
    customers: [] as Customer[],
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
        console.log("Fetching customers...")
        
        const url = baseURL + "/Customers?page=0"
        console.log("Request URL:", url)
        
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
        });

        console.log("Response status:", response.status)
        console.log("Response URL:", response.url)
        console.log("Response redirected:", response.redirected)
        console.log("Response headers:", response.headers.get('content-type'))
        
        if (!response.ok) {
          const errorText = await response.text()
          console.log("Error response body:", errorText)
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText.substring(0, 200)}...`)
        }

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text()
          console.log("Non-JSON response received:", responseText.substring(0, 500))
          throw new Error(`Expected JSON but received: ${contentType}. Response: ${responseText.substring(0, 200)}...`)
        }

        const data = await response.json()
        console.log("Raw API response:", data)
        this.customers = data || []
        
        this.lastUpdated = new Date()
        console.log("Customers fetched successfully:", this.customers.length)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        this.error = `Failed to fetch customers: ${errorMessage}`
        console.error("Error fetching customers:", errorMessage)
                
        // Ensure customers is always an array to prevent length errors
        this.customers = []
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
      this.customers = [] as Customer[]
      this.loading = false
      this.error = null
      this.lastUpdated = null
    }
  }
}) 