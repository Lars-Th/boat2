import { defineStore } from 'pinia'
import prospectorMockData from './prospector.json'

// Update interface to match the new Company structure from the service
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

interface ProspectorState {
  companies: Company[]
  selectedCompanies: Company[]
  apiMode: 'production' | 'development'
  mockData: Company[]
  searchResults: Company[]
  isLoading: boolean
  error: string | null
}

export const useProspectorStore = defineStore('prospector', {
  state: (): ProspectorState => ({
    companies: [],
    selectedCompanies: [],
    apiMode: 'production',
    mockData: prospectorMockData.companies,
    searchResults: [],
    isLoading: false,
    error: null
  }),
  getters: {
    activeCompanies: (state): Company[] => 
      state.companies.filter(company => company.status === 'Active'),
    hasResults: (state): boolean => state.searchResults.length > 0,
    companiesByBranch: (state) => (branch: string): Company[] =>
      state.companies.filter(company => 
        company.branch.toLowerCase().includes(branch.toLowerCase())
      ),
    companiesByCity: (state) => (city: string): Company[] =>
      state.companies.filter(company => 
        company.city.toLowerCase().includes(city.toLowerCase())
      ),
    companiesByEmployeeRange: (state) => (min: number, max: number): Company[] =>
      state.companies.filter(company => 
        company.employees >= min && company.employees <= max
      ),
    totalCompanies: (state): number => state.companies.length,
    selectedCompaniesCount: (state): number => state.selectedCompanies.length,
    currentApiMode: (state): string => state.apiMode
  },
  actions: {
    // Load mock data from JSON
    loadMockData() {
      this.companies = [...this.mockData]
    },
    
    // Set companies from API call
    setCompanies(companies: Company[]) {
      this.companies = companies
    },
    
    // Set search results
    setSearchResults(results: Company[]) {
      this.searchResults = results
    },
    
    // Clear search results
    clearResults() {
      this.searchResults = []
      this.error = null
    },
    
    // Set loading state
    setLoading(loading: boolean) {
      this.isLoading = loading
    },
    
    // Set error state
    setError(error: string | null) {
      this.error = error
    },
    
    // Validate activation code
    async validateActivationCode(code: string): Promise<boolean> {
      this.setLoading(true)
      this.setError(null)

      let isValid = false
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Simple validation - in real app this would call an API
        isValid = code.length >= 6 && /^[A-Z0-9]+$/.test(code)
        
        if (!isValid) {
          this.setError('Invalid activation code format')
        }
        
        return isValid
      } catch (err) {
        this.setError('Failed to validate activation code ' + err)
      } finally {
        this.setLoading(false)
      }

      return isValid
    },
    
    // Switch between production and development mode
    setApiMode(mode: 'production' | 'development') {
      this.apiMode = mode
      if (mode === 'development') {
        this.loadMockData()
      }
    },
    
    // Legacy methods for compatibility
    addToSelected(company: Company) {
      if (!this.selectedCompanies.find(c => c.id === company.id)) {
        this.selectedCompanies.push(company)
      }
    },
   
    removeFromSelected(companyId: number) {
      this.selectedCompanies = this.selectedCompanies.filter(c => c.id !== companyId)
    },
   
    clearSelected() {
      this.selectedCompanies = []
    }
  }
}) 