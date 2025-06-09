<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavigationSidebar from '@/components/layout/NavigationSidebar.vue'
import ToastContainer from '@/components/ui/toast/ToastContainer.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'

// Simulerad användarinfo
const currentUser = {
  name: 'Lars Thomas',
  email: 'lars.thomas@example.com',
  role: 'Administrator'
}

// Handle user actions from sidebar
const handleUserAction = (action: 'profile' | 'settings' | 'logout') => {
  switch (action) {
    case 'profile':
      console.log('Navigate to profile')
      break
    case 'settings':
      console.log('Navigate to settings')
      break
    case 'logout':
      console.log('Logout user')
      break
  }
}
</script>

<template>
  <ErrorBoundary show-details>
    <div class="flex h-screen bg-white">
      <!-- Navigation Sidebar -->
      <NavigationSidebar 
        :current-user="currentUser"
        @user-action="handleUserAction"
      />

      <!-- Main Content Area -->
      <main class="flex-1 overflow-auto bg-white">
        <RouterView />
      </main>
      
      <!-- Toast Container -->
      <ToastContainer />
    </div>
  </ErrorBoundary>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
