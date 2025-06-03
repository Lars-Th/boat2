import { ref } from 'vue'
import axios from 'axios'
import { useProspectorStore } from '@/storages/prospectorStore'

// Types for company search functionality only
export interface Company {
  id: number
  name: string
  organisationNumber: string
  description: string
  employees: number
  turnOver: number
  legalEntity: string
  vatNumber: string
  phone: string
  address: string
  postCode: string
  city: string
  branch: string
  status: string
  founded: string
}

export interface ProspectorResponse {
  companies: Company[]
  totalCount: number
  message?: string
}

export function useProspectorService() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const prospectorStore = useProspectorStore()
  
  // Client credentials from reference implementation
  const clientId = "cid_1a883e3bac7f4b9198633c724a211033"
  const clientSecret = "cs_1HJWP03nk/elflvU45bOKT4gWhuORsYBbboXTi9oqYYiHL/Zj6SENP401sxK0Veyfpv7GPW4ysofSGzLGvOVNA=="
  
  // Create axios instance with authentication
  const apiClient = axios.create({
    baseURL: '', // Empty string for Vite proxy to production API
    auth: {
      username: clientId,
      password: clientSecret
    },
    timeout: 10000
  })

  // Search companies - uses store mode to determine data source
  const searchCompanies = async (): Promise<ProspectorResponse> => {
    try {
      isLoading.value = true
      error.value = null
      
      // Check current API mode from store
      if (prospectorStore.apiMode === 'development') {
        // Use mock data from store
        prospectorStore.loadMockData()
        const companies = prospectorStore.companies
        
        return {
          companies,
          totalCount: companies.length,
          message: 'Mock data loaded successfully'
        }
      } else {
        // Call the production API
        const response = await apiClient.post('/api/insight/prospects?skip=0&take=200', [])
        
        // Transform the response to match our frontend interface
        const companies = response.data.map((company: any, index: number) => ({
          id: company.organisationNumber || index + 1,
          name: company.name,
          organisationNumber: company.organisationNumber,
          description: company.description || '',
          employees: company.employees || 0,
          turnOver: company.turnOver || 0,
          legalEntity: company.legalEntity || '',
          vatNumber: company.vatNumber || '',
          phone: company.phone || '',
          address: company.address || '',
          postCode: company.postCode || '',
          city: company.city || '',
          branch: company.branch || 'Unknown',
          status: 'Active',
          founded: company.founded || 'Unknown'
        }))
        
        // Store the companies in the store
        prospectorStore.setCompanies(companies)
        
        return {
          companies,
          totalCount: companies.length,
          message: 'Search completed successfully'
        }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to search companies'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Switch API mode
  const setApiMode = (mode: 'production' | 'development') => {
    prospectorStore.setApiMode(mode)
  }

  // Get current API mode
  const getApiMode = () => {
    return prospectorStore.apiMode
  }

  return {
    // State
    isLoading,
    error,
    
    // Methods
    searchCompanies,
    setApiMode,
    getApiMode
  }
} 