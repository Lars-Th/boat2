import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import Customers from '@/views/Customers.vue'
import CustomerDetails from '@/views/CustomerDetails.vue'
import Contacts from '@/views/Contacts.vue'
import ContactDetails from '@/views/ContactDetails.vue'
import WorkOrders from '@/views/WorkOrders.vue'
import WorkOrderDetails from '@/views/WorkOrderDetails.vue'
import Machines from '@/views/Machines.vue'
import Tools from '@/views/Tools.vue'
import Prospector from '@/views/Prospector.vue'
import CustomComponents from '@/views/CustomComponents.vue'
import NotificationDemo from '@/components/views/NotificationDemo.vue'
import ValidationDemo from '@/components/views/ValidationDemo.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/customers',
      name: 'customers',
      component: Customers
    },
    {
      path: '/customers/:id',
      name: 'customer-details',
      component: CustomerDetails
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: Contacts
    },
    {
      path: '/contacts/:id',
      name: 'contact-details',
      component: ContactDetails
    },
    {
      path: '/work-orders',
      name: 'work-orders',
      component: WorkOrders
    },
    {
      path: '/work-orders/new',
      name: 'work-order-new',
      component: WorkOrderDetails
    },
    {
      path: '/work-orders/:id',
      name: 'work-order-details',
      component: WorkOrderDetails
    },
    {
      path: '/machines',
      name: 'machines',
      component: Machines
    },
    {
      path: '/tools',
      name: 'tools',
      component: Tools
    },
    {
      path: '/prospector',
      name: 'prospector',
      component: Prospector
    },
    {
      path: '/custom-components',
      name: 'custom-components',
      component: CustomComponents
    },
    {
      path: '/demo',
      name: 'notification-demo',
      component: NotificationDemo
    },
    {
      path: '/validation-demo',
      name: 'validation-demo',
      component: ValidationDemo
    }
  ]
})

export default router 