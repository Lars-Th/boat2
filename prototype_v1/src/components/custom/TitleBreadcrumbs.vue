<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'

interface BreadcrumbItem {
  label: string
  to?: string | { name: string; params?: Record<string, any> }
  isCurrentPage?: boolean
}

interface Props {
  title: string
  breadcrumbs: BreadcrumbItem[]
  description?: string
}

defineProps<Props>()
const router = useRouter()

const navigateTo = (breadcrumb: BreadcrumbItem) => {
  if (breadcrumb.to && !breadcrumb.isCurrentPage) {
    if (typeof breadcrumb.to === 'string') {
      router.push(breadcrumb.to)
    } else {
      router.push(breadcrumb.to)
    }
  }
}
</script>

<template>
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
    <div class="flex-1">
      <h1 class="text-3xl font-semibold text-foreground mb-1">
        {{ title }}
      </h1>
      
      <!-- Functional breadcrumbs -->
      <nav
        class="flex items-center space-x-1 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <template
          v-for="(breadcrumb, index) in breadcrumbs"
          :key="index"
        >
          <!-- Breadcrumb item -->
          <button
            v-if="breadcrumb.to && !breadcrumb.isCurrentPage"
            class="hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded px-1"
            @click="navigateTo(breadcrumb)"
          >
            {{ breadcrumb.label }}
          </button>
          <span
            v-else
            :class="{
              'text-foreground font-medium': breadcrumb.isCurrentPage,
              'text-muted-foreground': !breadcrumb.isCurrentPage
            }"
          >
            {{ breadcrumb.label }}
          </span>
          
          <!-- Separator -->
          <ChevronRight 
            v-if="index < breadcrumbs.length - 1" 
            class="h-3 w-3 text-muted-foreground"
          />
        </template>
      </nav>
      
      <p
        v-if="description"
        class="text-sm text-muted-foreground mt-1"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template> 