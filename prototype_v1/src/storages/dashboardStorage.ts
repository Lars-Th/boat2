import { defineStore } from 'pinia'
import dashboardData from './dashboard.json'

interface DashboardStat {
  value: string
  label: string
  color?: string
}

interface QuickAction {
  id: number
  label: string
  action: string
}

interface NavigationItem {
  id: number
  label: string
  route: string
}

interface DashboardState {
  stats: DashboardStat[]
  quickActions: QuickAction[]
  navigationItems: NavigationItem[]
}

export const useDashboardStorage = defineStore('dashboard', {
  state: (): DashboardState => ({
    stats: dashboardData.stats as DashboardStat[],
    quickActions: dashboardData.quickActions as QuickAction[],
    navigationItems: dashboardData.navigationItems as NavigationItem[]
  }),
  getters: {
    totalUsers: (state): string => state.stats.find(stat => stat.label === 'Aktiva användare')?.value || '0',
    monthlyRevenue: (state): string => state.stats.find(stat => stat.label === 'Månadens intäkter')?.value || '$0',
    newOrders: (state): string => state.stats.find(stat => stat.label === 'Nya beställningar')?.value || '0',
    systemStatus: (state): string => state.stats.find(stat => stat.label === 'Systemstatus')?.value || '0%',
  },
  actions: {
    updateStat(label: string, newValue: string) {
      const stat = this.stats.find(s => s.label === label)
      if (stat) {
        stat.value = newValue
      }
    },
    addQuickAction(action: Omit<QuickAction, 'id'>) {
      this.quickActions.push({ ...action, id: Date.now() })
    },
    removeQuickAction(id: number) {
      this.quickActions = this.quickActions.filter(action => action.id !== id)
    },
    addNavigationItem(item: Omit<NavigationItem, 'id'>) {
      this.navigationItems.push({ ...item, id: Date.now() })
    },
    removeNavigationItem(id: number) {
      this.navigationItems = this.navigationItems.filter(item => item.id !== id)
    },
    async fetchDashboardData(): Promise<void> {
      // Replace this later with: await axios.get('/api/dashboard')
      // For now, data is already loaded from JSON file
    }
  }
}) 