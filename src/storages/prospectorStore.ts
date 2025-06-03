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
}

export const useProspectorStore = defineStore('prospector', {
  state: (): ProspectorState => ({
    companies: [],
    selectedCompanies: [],
    apiMode: 'production',
    mockData: prospectorMockData.companies
  }),
  getters: {
    activeCompanies: (state): Company[] => 
      state.companies.filter(company => company.status === 'Active'),
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