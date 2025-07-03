export const boatStorageRoutes = [
  {
    path: '/batlager',
    name: 'BoatStorage',
    component: () => import('@/views/BoatStorageOverview.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: 'overview'
      },
      {
        path: 'overview',
        name: 'BoatStorageOverview',
        component: () => import('@/views/BoatStorageOverview.vue')
      },
      {
        path: 'lager',
        name: 'WarehouseManagement',
        component: () => import('@/views/WarehouseManagement.vue')
      },
      {
        path: 'lager/:id/design',
        name: 'WarehouseDesigner',
        component: () => import('@/views/WarehouseDesigner.vue'),
        props: true
      },
      {
        path: 'bryggor',
        name: 'MarinaManagement',
        component: () => import('@/views/MarinaManagement.vue')
      },
      {
        path: 'bryggor/:id/design',
        name: 'MarinaDesigner',
        component: () => import('@/views/MarinaDesigner.vue'),
        props: true
      },
      {
        path: 'placement',
        name: 'BoatPlacementManager',
        component: () => import('@/views/BoatPlacementManager.vue')
      }
    ]
  }
];

export const boatStorageNavigation = {
  id: 'batlager',
  label: 'Båtlager',
  icon: 'anchor',
  route: '/batlager',
  children: [
    {
      id: 'batlager-overview',
      label: 'Översikt',
      route: '/batlager/overview',
      icon: 'dashboard'
    },
    {
      id: 'batlager-lager',
      label: 'Lager',
      route: '/batlager/lager',
      icon: 'warehouse'
    },
    {
      id: 'batlager-bryggor',
      label: 'Bryggor',
      route: '/batlager/bryggor',
      icon: 'dock'
    },
    {
      id: 'batlager-placement',
      label: 'Placering',
      route: '/batlager/placement',
      icon: 'move'
    }
  ]
};
