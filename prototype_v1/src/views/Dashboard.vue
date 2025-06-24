<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStorage } from '@/storages/dashboardStorage'
import { Button } from '@/components/ui/button'
import StandardHeader from '@/components/custom/StandardHeader.vue'
import DashboardCard from '@/components/custom/DashboardCard.vue'

interface BreadcrumbItem {
  label: string
  to?: string | { name: string; params?: Record<string, any> }
  isCurrentPage?: boolean
}

const dashboardStorage = useDashboardStorage()

// Statistik för dashboard
const stats = computed(() => dashboardStorage.stats)

// Functional breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', isCurrentPage: true }
]
</script>

<template>
  <div class="w-full">
    <!-- Using StandardHeader directly -->
    <StandardHeader
      title="Dashboard"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
    />

    <!-- Main content -->
    <div class="p-4 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title="Total Users"
          description="Active users this month"
          :value="dashboardStorage.totalUsers"
          :badge="{ text: '+12% from last month', variant: 'secondary' }"
        />

        <DashboardCard
          title="Revenue"
          description="Total revenue this month"
          :value="dashboardStorage.monthlyRevenue"
          :badge="{ text: '+8% from last month', variant: 'default' }"
        />

        <DashboardCard
          title="Orders"
          description="New orders this week"
          :value="dashboardStorage.newOrders"
          :badge="{ text: '+3% from last week', variant: 'outline' }"
        />
      </div>

      <DashboardCard
        title="Quick Actions"
        description="Common tasks and shortcuts"
        full-width
      >
        <div class="space-x-2">
          <Button 
            v-for="action in dashboardStorage.quickActions" 
            :key="action.id"
            class="text-xs"
            @click="console.log('Action:', action.action)"
          >
            {{ action.label }}
          </Button>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Navigation"
        full-width
      >
        <div class="grid gap-3">
          <div class="flex flex-col space-y-2">
            <Button 
              v-for="item in dashboardStorage.navigationItems" 
              :key="item.id"
              variant="outline" 
              class="text-xs" 
              @click="$router.push(item.route)"
            >
              {{ item.label }}
            </Button>
          </div>
        </div>
      </DashboardCard>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles if needed */
</style> 