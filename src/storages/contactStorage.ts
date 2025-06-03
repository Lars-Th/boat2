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
import contactsData from './contacts.json'

// =============================================================================
// ENTITY INTERFACES
// =============================================================================

export interface Contact extends BaseEntity {
  id: number
  name: string
  phone: string
  company: string
  status: 'Aktiv' | 'Inaktiv'
  email: string
  isMainContact: boolean
  customerId: number  // Foreign key to Customer
}

// =============================================================================
// STORE INTERFACES
// =============================================================================

interface ContactStoreState extends BaseStoreState {
  contacts: Contact[]
}

// =============================================================================
// CROSS-STORE TYPES (for type safety)
// =============================================================================

interface CustomerInfo {
  id: number
  companyName: string
  city: string
  status: 'Aktiv' | 'Inaktiv'
  companyType: 'Kund' | 'Leverantör' | 'ÅF' | 'Prospect'
}

// =============================================================================
// STORE DEFINITION
// =============================================================================

export const useContactStorage = defineStore('contact', {
  state: (): ContactStoreState => ({
    contacts: contactsData.map(contact => ({
      ...contact,
      createdAt: new Date(),
      updatedAt: new Date()
    })) as Contact[],
    loading: false,
    error: null,
    lastUpdated: null
  }),

  // =============================================================================
  // GETTERS
  // =============================================================================
  
  getters: {
    // Basic entity getters
    getContactById: (state) => (id: number): Contact | undefined => 
      state.contacts.find(contact => contact.id === id),

    // Status-based getters
    activeContacts: (state): Contact[] => 
      state.contacts.filter(contact => contact.status === 'Aktiv'),
    
    inactiveContacts: (state): Contact[] => 
      state.contacts.filter(contact => contact.status === 'Inaktiv'),

    mainContacts: (state): Contact[] => 
      state.contacts.filter(contact => contact.isMainContact),

    // Company-based getters
    getContactsByCompany: (state) => (company: string): Contact[] => 
      state.contacts.filter(contact => contact.company === company),
    
    // Customer relationship getters
    getContactsByCustomerId: (state) => (customerId: number): Contact[] => 
      state.contacts.filter(contact => contact.customerId === customerId),
    
    getMainContactByCustomerId: (state) => (customerId: number): Contact | undefined =>
      state.contacts.find(contact => contact.customerId === customerId && contact.isMainContact),

    // Enhanced getters with cross-store data (to be used from components)
    getContactWithOtherContacts: (state) => (contactId: number) => {
      const contact = state.contacts.find(c => c.id === contactId)
      if (!contact) return undefined

      return {
        ...contact,
        // Get other contacts for the same company
        otherContacts: state.contacts.filter(c => 
          c.customerId === contact.customerId && c.id !== contact.id
        )
      }
    },

    getAllContactsWithOtherContacts: (state) => {
      return state.contacts.map(contact => ({
        ...contact,
        otherContacts: state.contacts.filter(c => 
          c.customerId === contact.customerId && c.id !== contact.id
        )
      }))
    },

    // Statistics
    totalContacts: (state): number => state.contacts.length,
    
    // Contact counts by customer
    getContactCountByCustomerId: (state) => (customerId: number): number =>
      state.contacts.filter(contact => contact.customerId === customerId).length
  },

  // =============================================================================
  // ACTIONS
  // =============================================================================
  
  actions: {
    // =============================================================================
    // CONTACT CRUD OPERATIONS
    // =============================================================================
    
    async addContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) {
      try {
        this.loading = true
        this.error = null

        const newContact: Contact = {
          ...contactData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }

        this.contacts.push(newContact)
        this.lastUpdated = new Date()

        return { success: true, data: newContact }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        this.error = `Failed to add contact: ${errorMessage}`
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    async updateContact(updatedContact: Contact) {
      try {
        this.loading = true
        this.error = null

        const index = this.contacts.findIndex(c => c.id === updatedContact.id)
        if (index === -1) {
          throw new Error(`Contact with id ${updatedContact.id} not found`)
        }

        this.contacts[index] = {
          ...updatedContact,
          updatedAt: new Date()
        }
        this.lastUpdated = new Date()

        return { success: true, data: this.contacts[index] }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        this.error = `Failed to update contact: ${errorMessage}`
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    async removeContact(contactId: number) {
      try {
        this.loading = true
        this.error = null

        const contactIndex = this.contacts.findIndex(c => c.id === contactId)
        if (contactIndex === -1) {
          throw new Error(`Contact with id ${contactId} not found`)
        }

        this.contacts.splice(contactIndex, 1)
        this.lastUpdated = new Date()

        return { success: true }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        this.error = `Failed to remove contact: ${errorMessage}`
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    async setMainContact(customerId: number, contactId: number) {
      try {
        this.loading = true
        this.error = null

        // Validate that the contact belongs to the customer
        const contact = this.contacts.find(c => c.id === contactId)
        if (!contact || contact.customerId !== customerId) {
          throw new Error('Contact does not belong to the specified customer')
        }

        // Remove main contact status from all contacts of this customer
        this.contacts.forEach(c => {
          if (c.customerId === customerId) {
            c.isMainContact = false
            c.updatedAt = new Date()
          }
        })

        // Set the new main contact
        const targetContact = this.contacts.find(c => c.id === contactId)
        if (targetContact) {
          targetContact.isMainContact = true
          targetContact.updatedAt = new Date()
        }

        this.lastUpdated = new Date()

        return { success: true }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        this.error = `Failed to set main contact: ${errorMessage}`
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // =============================================================================
    // DATA FETCHING
    // =============================================================================

    async fetchContacts(): Promise<void> {
      try {
        this.loading = true
        this.error = null
        
        // TODO: Replace with actual API call
        // const response = await axios.get('/api/contacts')
        // this.contacts = response.data
        
        // For now, data is already loaded from JSON file
        this.lastUpdated = new Date()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        this.error = `Failed to fetch contacts: ${errorMessage}`
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
      this.contacts = contactsData.map(contact => ({
        ...contact,
        createdAt: new Date(),
        updatedAt: new Date()
      })) as Contact[]
      this.loading = false
      this.error = null
      this.lastUpdated = null
    }
  }
}) 