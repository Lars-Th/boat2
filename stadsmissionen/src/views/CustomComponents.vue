<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef } from 'vue';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Edit,
  FileText,
  Folder,
  FolderOpen,
  Laptop,
  Monitor,
  Plus,
  Settings,
  Smartphone,
  Trash2,
  Upload,
  User,
} from 'lucide-vue-next';
import StandardHeader from '@/components/layout/StandardHeader.vue';
import { Button } from '@/components/ui/button';

// Import all components
import DataTable from '@/components/shared/DataTable.vue';
import ViewControls from '@/components/shared/ViewControls.vue';
import DetailPage from '@/components/shared/DetailPage.vue';
import ComplexDetailPage from '@/components/shared/ComplexDetailPage.vue';
import ListPage from '@/components/shared/ListPage.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ErrorBoundary from '@/components/common/ErrorBoundary.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import NavigationSidebar from '@/components/layout/NavigationSidebar.vue';

// Activity components
import ActivityForm from '@/components/features/activity/ActivityForm.vue';
import ActivityParticipantSelector from '@/components/features/activity/ActivityParticipantSelector.vue';
import ActivityDetailsForm from '@/components/features/activity/ActivityDetailsForm.vue';
import ActivitySeriesSettings from '@/components/features/activity/ActivitySeriesSettings.vue';
import ActivityTemplateSelector from '@/components/features/activity/ActivityTemplateSelector.vue';

// User components
import PasswordChangeDialog from '@/components/features/user/PasswordChangeDialog.vue';
import RoleInformationCards from '@/components/features/user/RoleInformationCards.vue';
import UserForm from '@/components/features/user/UserForm.vue';

// Organization components
import UnitManager from '@/components/features/organization/UnitManager.vue';
import OrganizationManager from '@/components/features/organization/OrganizationManager.vue';
import OrganizationCard from '@/components/features/organization/OrganizationCard.vue';
import NewOrganizationForm from '@/components/features/organization/NewOrganizationForm.vue';

// Toast Example component
import ToastExample from '@/components/features/development/ToastExample.vue';

// File tree structure
interface TreeNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
  component?: any;
  props?: any;
}

const fileTree: TreeNode[] = [
  {
    name: 'pages',
    path: 'pages',
    type: 'folder',
    children: [],
  },
  {
    name: 'common',
    path: 'common',
    type: 'folder',
    children: [
      {
        name: 'ErrorBoundary.vue',
        path: 'common/ErrorBoundary.vue',
        type: 'file',
        component: ErrorBoundary,
        props: { fallback: 'Something went wrong in this component' },
      },
      {
        name: 'LoadingSpinner.vue',
        path: 'common/LoadingSpinner.vue',
        type: 'file',
        component: LoadingSpinner,
      },
    ],
  },
  {
    name: 'features',
    path: 'features',
    type: 'folder',
    children: [
      {
        name: 'activity',
        path: 'features/activity',
        type: 'folder',
        children: [
          {
            name: 'ActivityDetailsForm.vue',
            path: 'features/activity/ActivityDetailsForm.vue',
            type: 'file',
            component: ActivityDetailsForm,
            props: {
              activity: {
                name: 'Demo Activity',
                description: 'This is a demo activity',
                startDate: '2024-01-20',
                endDate: '2024-01-21',
                location: 'Demo Location',
              },
            },
          },
          {
            name: 'ActivityForm.vue',
            path: 'features/activity/ActivityForm.vue',
            type: 'file',
            component: ActivityForm,
            props: {
              activity: {
                name: 'Demo Activity',
                description: 'This is a demo activity form',
                startDate: '2024-01-20',
                endDate: '2024-01-21',
              },
            },
          },
          {
            name: 'ActivityParticipantSelector.vue',
            path: 'features/activity/ActivityParticipantSelector.vue',
            type: 'file',
            component: ActivityParticipantSelector,
            props: {
              selectedParticipants: [],
              availableParticipants: [
                { id: 1, name: 'Anna Andersson', email: 'anna@example.com' },
                { id: 2, name: 'Erik Svensson', email: 'erik@example.com' },
              ],
            },
          },
          {
            name: 'ActivitySeriesSettings.vue',
            path: 'features/activity/ActivitySeriesSettings.vue',
            type: 'file',
            component: ActivitySeriesSettings,
            props: {
              settings: {
                frequency: 'weekly',
                endDate: '2024-12-31',
                maxParticipants: 20,
              },
            },
          },
          {
            name: 'ActivityTemplateSelector.vue',
            path: 'features/activity/ActivityTemplateSelector.vue',
            type: 'file',
            component: ActivityTemplateSelector,
            props: {
              templates: [
                { id: 1, name: 'Workshop Template', description: 'Standard workshop setup' },
                { id: 2, name: 'Meeting Template', description: 'Regular meeting format' },
              ],
            },
          },
        ],
      },

      {
        name: 'organization',
        path: 'features/organization',
        type: 'folder',
        children: [
          {
            name: 'NewOrganizationForm.vue',
            path: 'features/organization/NewOrganizationForm.vue',
            type: 'file',
            component: NewOrganizationForm,
          },
          {
            name: 'OrganizationCard.vue',
            path: 'features/organization/OrganizationCard.vue',
            type: 'file',
            component: OrganizationCard,
            props: {
              organization: {
                id: 'demo-org-1',
                namn: 'Demo Organization',
                aktiv: true,
                enheter: ['Enhet 1', 'Enhet 2', 'Enhet 3', 'Enhet 4'],
                kontaktuppgifter: {
                  telefon: '08-123 45 67',
                  ort: 'Stockholm',
                },
              },
              isSelected: false,
            },
          },
          {
            name: 'OrganizationManager.vue',
            path: 'features/organization/OrganizationManager.vue',
            type: 'file',
            component: OrganizationManager,
            props: {
              organizations: [
                {
                  id: 'demo-org-1',
                  namn: 'Demo Org 1',
                  aktiv: true,
                  enheter: ['Enhet A', 'Enhet B'],
                  kontaktuppgifter: {
                    telefon: '08-111 11 11',
                    ort: 'Stockholm',
                  },
                },
                {
                  id: 'demo-org-2',
                  namn: 'Demo Org 2',
                  aktiv: true,
                  enheter: ['Enhet X', 'Enhet Y', 'Enhet Z'],
                  kontaktuppgifter: {
                    telefon: '08-222 22 22',
                    ort: 'Göteborg',
                  },
                },
              ],
              selectedOrgId: 'demo-org-1',
              users: [],
            },
          },
          {
            name: 'UnitManager.vue',
            path: 'features/organization/UnitManager.vue',
            type: 'file',
            component: UnitManager,
            props: {
              units: ['Demo Unit 1', 'Demo Unit 2', 'Demo Unit 3'],
              organizationName: 'Demo Organization',
            },
          },
        ],
      },
      {
        name: 'user',
        path: 'features/user',
        type: 'folder',
        children: [
          {
            name: 'PasswordChangeDialog.vue',
            path: 'features/user/PasswordChangeDialog.vue',
            type: 'file',
            component: PasswordChangeDialog,
            props: {
              isOpen: true,
              user: { id: 1, name: 'Demo User' },
            },
          },
          {
            name: 'RoleInformationCards.vue',
            path: 'features/user/RoleInformationCards.vue',
            type: 'file',
            component: RoleInformationCards,
            props: {
              roles: [
                { name: 'Admin', description: 'Full system access' },
                { name: 'User', description: 'Standard user access' },
              ],
            },
          },
          {
            name: 'UserForm.vue',
            path: 'features/user/UserForm.vue',
            type: 'file',
            component: UserForm,
            props: {
              user: {
                name: 'Demo User',
                email: 'demo@example.com',
                role: 'User',
              },
            },
          },
        ],
      },
    ],
  },
  {
    name: 'layout',
    path: 'layout',
    type: 'folder',
    children: [
      {
        name: 'NavigationSidebar.vue',
        path: 'layout/NavigationSidebar.vue',
        type: 'file',
        component: NavigationSidebar,
        props: {
          isCollapsed: false,
        },
      },

      {
        name: 'StandardHeader.vue',
        path: 'layout/StandardHeader.vue',
        type: 'file',
        component: StandardHeader,
        props: {
          title: 'Demo Header Titel',
          breadcrumbs: [
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'Layout', to: '/layout' },
            { label: 'Headers', to: '/headers' },
            { label: 'Demo Header', isCurrentPage: true },
          ],
          showStats: true,
          stats: [
            { label: 'Användare', value: 1247, color: 'text-blue-600' },
            { label: 'Aktiva', value: 892, color: 'text-green-600' },
            { label: 'Väntar', value: 64, color: 'text-orange-600' },
            { label: 'Inaktiva', value: 291, color: 'text-red-600' },
          ],
        },
      },
    ],
  },
  {
    name: 'shared',
    path: 'shared',
    type: 'folder',
    children: [
      {
        name: 'DataTable.vue',
        path: 'shared/DataTable.vue',
        type: 'file',
        component: DataTable,
        props: {
          columns: [
            { key: 'name', label: 'Namn', sortable: true },
            { key: 'email', label: 'E-post', sortable: true },
            { key: 'phone', label: 'Telefon', sortable: true, class: 'hidden sm:table-cell' },
            {
              key: 'department',
              label: 'Avdelning',
              sortable: true,
              class: 'hidden md:table-cell',
            },
            {
              key: 'status',
              label: 'Status',
              sortable: true,
              type: 'badge',
              class: 'hidden lg:table-cell',
              badgeVariant: (value: string) => (value === 'active' ? 'default' : 'secondary'),
            },
            {
              key: 'lastLogin',
              label: 'Senast inloggad',
              sortable: true,
              class: 'hidden xl:table-cell',
              format: (value: string) =>
                value ? new Date(value).toLocaleDateString('sv-SE') : '-',
            },
            { key: 'actions', label: 'Åtgärder', type: 'actions', width: '120px', align: 'right' },
          ],
          data: [
            {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '070-123 45 67',
              department: 'IT',
              status: 'active',
              lastLogin: '2024-01-20T10:30:00Z',
            },
            {
              id: 2,
              name: 'Jane Smith',
              email: 'jane@example.com',
              phone: '070-234 56 78',
              department: 'HR',
              status: 'active',
              lastLogin: '2024-01-19T14:15:00Z',
            },
            {
              id: 3,
              name: 'Bob Johnson',
              email: 'bob@example.com',
              phone: '070-345 67 89',
              department: 'Sales',
              status: 'inactive',
              lastLogin: '2024-01-10T09:00:00Z',
            },
            {
              id: 4,
              name: 'Alice Williams',
              email: 'alice@example.com',
              phone: '070-456 78 90',
              department: 'Marketing',
              status: 'active',
              lastLogin: '2024-01-21T16:45:00Z',
            },
            {
              id: 5,
              name: 'Charlie Brown',
              email: 'charlie@example.com',
              phone: '070-567 89 01',
              department: 'Finance',
              status: 'active',
              lastLogin: '2024-01-18T11:20:00Z',
            },
          ],
          searchFields: ['name', 'email', 'phone', 'department'],
        },
      },
      {
        name: 'ListPage.vue',
        path: 'shared/ListPage.vue',
        type: 'file',
        component: ListPage,
        props: {
          title: 'Demo Lista',
          description: 'En demonstration av ListPage-komponenten',
          breadcrumbs: [
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'Demo', to: '/demo' },
            { label: 'Lista', isCurrentPage: true },
          ],
          showStats: true,
          stats: [
            { label: 'Totalt', value: 156, color: 'text-blue-600' },
            { label: 'Aktiva', value: 142, color: 'text-green-600' },
            { label: 'Väntar', value: 8, color: 'text-orange-600' },
            { label: 'Inaktiva', value: 6, color: 'text-red-600' },
          ],
          searchQuery: '',
          searchPlaceholder: 'Sök demo objekt...',
          addActions: [
            {
              label: 'Lägg till objekt',
              icon: Plus,
              onClick: () => console.log('Add object clicked'),
              variant: 'default',
            },
          ],
          filters: [
            {
              modelValue: 'all',
              placeholder: 'Status',
              options: [
                { key: 'all', label: 'Alla status', value: 'all' },
                { key: 'active', label: 'Aktiva', value: 'active' },
                { key: 'inactive', label: 'Inaktiva', value: 'inactive' },
              ],
              onChange: value => console.log('Filter changed:', value),
            },
          ],
          data: [
            {
              id: 1,
              name: 'Demo Objekt 1',
              status: 'active',
              created: '2024-01-20',
              category: 'Kategori A',
            },
            {
              id: 2,
              name: 'Demo Objekt 2',
              status: 'inactive',
              created: '2024-01-19',
              category: 'Kategori B',
            },
            {
              id: 3,
              name: 'Demo Objekt 3',
              status: 'active',
              created: '2024-01-18',
              category: 'Kategori A',
            },
          ],
          columns: [
            { key: 'name', label: 'Namn', sortable: true },
            { key: 'status', label: 'Status', sortable: true, type: 'custom' },
            { key: 'category', label: 'Kategori', sortable: true },
            { key: 'created', label: 'Skapad', sortable: true },
            { key: 'actions', label: 'Åtgärder', type: 'actions', width: '120px' },
          ],
          totalItems: 3,
          currentPage: 1,
          itemsPerPage: 10,
          loading: false,
        },
      },
      {
        name: 'ViewControls.vue',
        path: 'shared/ViewControls.vue',
        type: 'file',
        component: ViewControls,
        props: {
          addActions: [
            {
              label: 'Lägg till komponent',
              icon: Plus,
              onClick: () => console.log('Add component clicked'),
              variant: 'default',
            },
            {
              label: 'Importera',
              icon: Upload,
              onClick: () => console.log('Import clicked'),
              variant: 'default',
              class: 'bg-blue-600 hover:bg-blue-700 text-white',
            },
          ],
          additionalActions: [
            {
              label: 'Exportera',
              icon: Download,
              onClick: () => console.log('Export clicked'),
              variant: 'outline',
            },
            {
              label: 'Inställningar',
              icon: Settings,
              onClick: () => console.log('Settings clicked'),
              variant: 'outline',
            },
          ],
          filters: [
            {
              modelValue: 'all',
              placeholder: 'Status',
              options: [
                { key: 'all', label: 'Alla status', value: 'all' },
                { key: 'active', label: 'Aktiva', value: 'active' },
                { key: 'inactive', label: 'Inaktiva', value: 'inactive' },
              ],
              onChange: value => console.log('Status filter changed:', value),
            },
            {
              modelValue: 'all',
              placeholder: 'Typ',
              options: [
                { key: 'all', label: 'Alla typer', value: 'all' },
                { key: 'component', label: 'Komponenter', value: 'component' },
                { key: 'page', label: 'Sidor', value: 'page' },
                { key: 'layout', label: 'Layout', value: 'layout' },
              ],
              onChange: value => console.log('Type filter changed:', value),
            },
          ],
          searchQuery: '',
          searchPlaceholder: 'Sök komponenter...',
          showSearch: true,
        },
      },

      {
        name: 'DetailPage.vue',
        path: 'shared/DetailPage.vue',
        type: 'file',
        component: DetailPage,
        props: {
          title: 'Demo Detaljer',
          description: 'En demonstration av DetailPage-komponenten',
          breadcrumbs: [
            { label: 'Dashboard', to: '/overview' },
            { label: 'Demo', to: '/demo' },
            { label: 'Detaljer', isCurrentPage: true },
          ],
          showStats: true,
          stats: [
            { label: 'Skapad', value: '2024-01-20', color: 'text-blue-600' },
            { label: 'Status', value: 'Aktiv', color: 'text-green-600' },
            { label: 'Uppdaterad', value: '2024-01-21', color: 'text-orange-600' },
          ],
          data: {
            name: 'Demo Produkt',
            description: 'En fantastisk demo produkt som visar alla funktioner',
            category: 'elektronik',
            price: 1299,
            status: 'active',
            manufacturer: 'Demo AB',
            model: 'DM-2024',
            serialNumber: 'DM240120001',
            purchaseDate: '2024-01-15',
            warrantyExpires: '2026-01-15',
            location: 'Lager A, Hylla 12',
            notes:
              'Denna produkt är en demonstration av DetailPage-komponenten och visar hur data presenteras på ett strukturerat sätt.',
          },
          mainFields: [
            { key: 'name', label: 'Produktnamn', type: 'text' },
            { key: 'description', label: 'Beskrivning', type: 'textarea' },
            {
              key: 'category',
              label: 'Kategori',
              type: 'select',
              options: [
                { value: 'elektronik', label: 'Elektronik' },
                { value: 'kläder', label: 'Kläder' },
                { value: 'böcker', label: 'Böcker' },
              ],
            },
            { key: 'price', label: 'Pris (SEK)', type: 'number' },
            { key: 'manufacturer', label: 'Tillverkare', type: 'text' },
            { key: 'model', label: 'Modell', type: 'text' },
          ],
          sidebarFields: [
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'active', label: 'Aktiv' },
                { value: 'inactive', label: 'Inaktiv' },
                { value: 'discontinued', label: 'Utgått' },
              ],
            },
            { key: 'serialNumber', label: 'Serienummer', type: 'text' },
            { key: 'purchaseDate', label: 'Inköpsdatum', type: 'date' },
            { key: 'warrantyExpires', label: 'Garanti utgår', type: 'date' },
            { key: 'location', label: 'Plats', type: 'text' },
            { key: 'notes', label: 'Anteckningar', type: 'textarea' },
          ],
          readonly: false,
          hasUnsavedChanges: false,
        },
      },

      {
        name: 'ComplexDetailPage.vue',
        path: 'shared/ComplexDetailPage.vue',
        type: 'file',
        component: ComplexDetailPage,
        props: {
          title: 'Komplex Demo Sida',
          description: 'En demonstration av ComplexDetailPage-komponenten',
          breadcrumbs: [
            { label: 'Dashboard', to: '/overview' },
            { label: 'Demo', to: '/demo' },
            { label: 'Komplex', isCurrentPage: true },
          ],
          showStats: true,
          stats: [
            { label: 'Komponenter', value: 12, color: 'text-blue-600' },
            { label: 'Sektioner', value: 5, color: 'text-green-600' },
            { label: 'Interaktioner', value: 8, color: 'text-purple-600' },
          ],
          data: {
            projectName: 'Avancerat Demo Projekt',
            projectDescription:
              'Ett komplext projekt som demonstrerar alla funktioner i ComplexDetailPage-komponenten',
            projectManager: 'Anna Svensson',
            department: 'utveckling',
            priority: 'hög',
            budget: 250000,
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            status: 'pågående',
            completionPercentage: 65,
            teamSize: 8,
            lastUpdated: '2024-01-21',
            notes:
              'Detta projekt visar hur ComplexDetailPage kan hantera stora mängder data och komplexa relationer mellan olika objekt.',
          },
          mainFields: [
            { key: 'projectName', label: 'Projektnamn', type: 'text' },
            { key: 'projectDescription', label: 'Beskrivning', type: 'textarea' },
            { key: 'projectManager', label: 'Projektledare', type: 'text' },
            {
              key: 'department',
              label: 'Avdelning',
              type: 'select',
              options: [
                { value: 'utveckling', label: 'Utveckling' },
                { value: 'design', label: 'Design' },
                { value: 'marknadsföring', label: 'Marknadsföring' },
              ],
            },
            { key: 'budget', label: 'Budget (SEK)', type: 'number' },
            { key: 'teamSize', label: 'Teamstörlek', type: 'number' },
          ],
          sidebarFields: [
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'planering', label: 'Planering' },
                { value: 'pågående', label: 'Pågående' },
                { value: 'pausad', label: 'Pausad' },
                { value: 'avslutad', label: 'Avslutad' },
              ],
            },
            {
              key: 'priority',
              label: 'Prioritet',
              type: 'select',
              options: [
                { value: 'låg', label: 'Låg' },
                { value: 'medel', label: 'Medel' },
                { value: 'hög', label: 'Hög' },
                { value: 'kritisk', label: 'Kritisk' },
              ],
            },
            { key: 'startDate', label: 'Startdatum', type: 'date' },
            { key: 'endDate', label: 'Slutdatum', type: 'date' },
            { key: 'completionPercentage', label: 'Färdigställande (%)', type: 'number' },
            { key: 'lastUpdated', label: 'Senast uppdaterad', type: 'date' },
          ],
          subTables: [
            {
              key: 'team',
              title: 'Projektteam',
              data: [
                {
                  id: 1,
                  name: 'Erik Andersson',
                  role: 'Utvecklare',
                  email: 'erik@example.com',
                  active: true,
                },
                {
                  id: 2,
                  name: 'Maria Johansson',
                  role: 'Designer',
                  email: 'maria@example.com',
                  active: true,
                },
                {
                  id: 3,
                  name: 'Lars Pettersson',
                  role: 'Testare',
                  email: 'lars@example.com',
                  active: false,
                },
              ],
              columns: [
                { key: 'name', label: 'Namn', sortable: true },
                { key: 'role', label: 'Roll', sortable: true },
                { key: 'email', label: 'E-post', sortable: true },
                {
                  key: 'active',
                  label: 'Aktiv',
                  type: 'badge',
                  badgeVariant: (value: boolean) => (value ? 'default' : 'secondary'),
                },
                {
                  key: 'actions',
                  label: 'Åtgärder',
                  type: 'actions',
                  width: '120px',
                  align: 'right',
                },
              ],
              allowAdd: true,
              allowEdit: true,
              allowDelete: true,
            },
            {
              key: 'tasks',
              title: 'Uppgifter',
              data: [
                {
                  id: 1,
                  title: 'Designa UI',
                  status: 'completed',
                  assignee: 'Maria Johansson',
                  dueDate: '2024-01-15',
                },
                {
                  id: 2,
                  title: 'Implementera backend',
                  status: 'in-progress',
                  assignee: 'Erik Andersson',
                  dueDate: '2024-02-01',
                },
                {
                  id: 3,
                  title: 'Testa funktionalitet',
                  status: 'pending',
                  assignee: 'Lars Pettersson',
                  dueDate: '2024-02-15',
                },
              ],
              columns: [
                { key: 'title', label: 'Uppgift', sortable: true },
                {
                  key: 'status',
                  label: 'Status',
                  type: 'badge',
                  badgeVariant: (value: string) => {
                    switch (value) {
                      case 'completed':
                        return 'default';
                      case 'in-progress':
                        return 'secondary';
                      case 'pending':
                        return 'outline';
                      default:
                        return 'secondary';
                    }
                  },
                },
                { key: 'assignee', label: 'Tilldelad', sortable: true },
                { key: 'dueDate', label: 'Förfallodatum', type: 'date', sortable: true },
                {
                  key: 'actions',
                  label: 'Åtgärder',
                  type: 'actions',
                  width: '120px',
                  align: 'right',
                },
              ],
              allowAdd: true,
              allowEdit: true,
              allowDelete: true,
            },
          ],
          readonly: false,
          hasUnsavedChanges: true,
        },
      },
    ],
  },
];

// State
const expandedFolders = ref(new Set(['pages', 'features', 'shared']));
const selectedComponent = shallowRef<TreeNode | null>(null);

// Viewport state
type ViewportType = 'desktop' | 'laptop' | 'phone';
const currentViewport = ref<ViewportType>('desktop');

// View toggle state
const currentView = ref<'components' | 'toasts'>('components');

// Component preview ref for isolated styling
const componentPreview = ref<HTMLElement | null>(null);

// Spacing target selection
const spacingTarget = ref<SpacingTarget>('all');

// Methods
const toggleFolder = (path: string) => {
  if (expandedFolders.value.has(path)) {
    expandedFolders.value.delete(path);
  } else {
    expandedFolders.value.add(path);
  }
};

const selectComponent = (node: TreeNode) => {
  if (node.type === 'file' && node.component) {
    selectedComponent.value = node;
  }
};

const isExpanded = (path: string) => expandedFolders.value.has(path);

const setViewport = (viewport: ViewportType) => {
  currentViewport.value = viewport;
};

// Computed styles for different viewports
const viewportStyles = computed(() => {
  switch (currentViewport.value) {
    case 'desktop':
      return {
        width: '100%',
        maxWidth: '1200px',
        aspectRatio: '16/9',
      };
    case 'laptop':
      return {
        width: '1024px',
        maxWidth: '1024px',
        aspectRatio: '16/10',
      };
    case 'phone':
      return {
        width: '375px',
        maxWidth: '375px',
        aspectRatio: '9/16',
      };
    default:
      return {
        width: '100%',
        maxWidth: '1200px',
        aspectRatio: '16/9',
      };
  }
});

// Event handlers for ComplexDetailPage
const handleFieldChange = (key: string, value: any) => {
  console.log('Field changed:', key, value);
  // In a real app, you would update the data here
  if (selectedComponent.value?.props?.data) {
    selectedComponent.value.props.data[key] = value;
  }
};

const handleSave = () => {
  console.log('Save clicked');
  // In a real app, you would save the data here
};

const handleDelete = () => {
  console.log('Delete clicked');
  // In a real app, you would delete the item here
};

const handleBack = () => {
  console.log('Back clicked');
  // In a real app, you would navigate back here
};

const handleDiscardChanges = () => {
  console.log('Discard changes clicked');
  // In a real app, you would revert the changes here
};

const handleAddSubItem = (tableKey: string) => {
  console.log('Add sub item to table:', tableKey);
  // In a real app, you would add a new item to the specified table
};

const handleEditSubItem = (tableKey: string, item: any) => {
  console.log('Edit sub item from table:', tableKey, item);
  // In a real app, you would edit the specified item
};

const handleDeleteSubItem = (tableKey: string, item: any) => {
  console.log('Delete sub item from table:', tableKey, item);
  // In a real app, you would delete the specified item
};

const handleSubItemClick = (tableKey: string, item: any) => {
  console.log('Sub item clicked in table:', tableKey, item);
  // In a real app, you would handle the item click here
};

// Statistics for the header
const componentCount = computed(() => {
  if (!fileTree || !Array.isArray(fileTree)) return 0;
  let count = 0;
  const countComponents = (nodes: TreeNode[]) => {
    nodes.forEach(node => {
      if (node.type === 'file') {
        count++;
      } else if (node.children) {
        countComponents(node.children);
      }
    });
  };
  countComponents(fileTree);
  return count;
});

const pageCount = computed(() => {
  if (!fileTree || !Array.isArray(fileTree)) return 0;
  const pagesNode = fileTree.find(node => node.name === 'pages');
  return pagesNode?.children?.length ?? 0;
});

const uiComponentCount = computed(() => {
  if (!fileTree || !Array.isArray(fileTree)) return 0;
  const uiNodes = fileTree.filter(node => node.name !== 'pages');
  let count = 0;
  const countComponents = (nodes: TreeNode[]) => {
    nodes.forEach(node => {
      if (node.type === 'file') {
        count++;
      } else if (node.children) {
        countComponents(node.children);
      }
    });
  };
  countComponents(uiNodes);
  return count;
});

// Spacing Variables Management with Algebraic Relationships
interface SpacingVariable {
  name: string;
  variable: string;
  baseValue: number; // The base mathematical relationship
  computedValue: number; // Current computed value
}

type SpacingTarget = 'all' | 'margin' | 'padding' | 'gap';

// Base mathematical relationships for spacing (in rem)
// These define the algebraic function: f(x) = baseValue * multiplier
const spacingVariables = ref<SpacingVariable[]>([
  { name: 'Space 0', variable: '--space-0', baseValue: 0, computedValue: 0 },
  { name: 'Space 1', variable: '--space-1', baseValue: 0.25, computedValue: 0.25 },
  { name: 'Space 2', variable: '--space-2', baseValue: 0.5, computedValue: 0.5 },
  { name: 'Space 3', variable: '--space-3', baseValue: 0.75, computedValue: 0.75 },
  { name: 'Space 4', variable: '--space-4', baseValue: 1, computedValue: 1 },
  { name: 'Space 5', variable: '--space-5', baseValue: 1.25, computedValue: 1.25 },
  { name: 'Space 6', variable: '--space-6', baseValue: 1.5, computedValue: 1.5 },
  { name: 'Space 8', variable: '--space-8', baseValue: 2, computedValue: 2 },
  { name: 'Space 10', variable: '--space-10', baseValue: 2.5, computedValue: 2.5 },
  { name: 'Space 12', variable: '--space-12', baseValue: 3, computedValue: 3 },
  { name: 'Space 16', variable: '--space-16', baseValue: 4, computedValue: 4 },
  { name: 'Space 20', variable: '--space-20', baseValue: 5, computedValue: 5 },
  { name: 'Space 24', variable: '--space-24', baseValue: 6, computedValue: 6 },
]);

// Global spacing multiplier - the single control that affects all spacing
const spacingMultiplier = ref<number>(1);

// Usage examples for margins and paddings
const marginExamples = [
  { class: 'm-1', description: 'margin: 0.25rem' },
  { class: 'm-2', description: 'margin: 0.5rem' },
  { class: 'm-4', description: 'margin: 1rem' },
  { class: 'mx-6', description: 'margin-left & right: 1.5rem' },
  { class: 'my-8', description: 'margin-top & bottom: 2rem' },
];

const paddingExamples = [
  { class: 'p-1', description: 'padding: 0.25rem' },
  { class: 'p-2', description: 'padding: 0.5rem' },
  { class: 'p-4', description: 'padding: 1rem' },
  { class: 'px-6', description: 'padding-left & right: 1.5rem' },
  { class: 'py-8', description: 'padding-top & bottom: 2rem' },
];

const gapExamples = [
  { class: 'gap-1', description: 'gap: 0.25rem' },
  { class: 'gap-2', description: 'gap: 0.5rem' },
  { class: 'gap-4', description: 'gap: 1rem' },
  { class: 'gap-x-6', description: 'column-gap: 1.5rem' },
  { class: 'gap-y-8', description: 'row-gap: 2rem' },
];

// Variable mapping for spacing numbers to match main.css variables
const spacingMap: { [key: string]: string } = {
  '--space-0': '0',
  '--space-1': '1',
  '--space-2': '2',
  '--space-3': '3',
  '--space-4': '4',
  '--space-5': '5',
  '--space-6': '6',
  '--space-8': '8',
  '--space-10': '10',
  '--space-12': '12',
  '--space-16': '16',
  '--space-20': '20',
  '--space-24': '24',
};

// Compute all spacing values using algebraic function: f(x) = baseValue * multiplier
const computeSpacingValues = () => {
  spacingVariables.value.forEach(spacing => {
    // Apply algebraic function: computedValue = baseValue * multiplier
    spacing.computedValue = spacing.baseValue * spacingMultiplier.value;
  });
};

// Update CSS custom properties for all spacing variables
const updateAllSpacingVariables = () => {
  if (componentPreview.value) {
    spacingVariables.value.forEach(spacing => {
      const remValue = `${spacing.computedValue}rem`;

      // Apply to the base spacing variable
      componentPreview.value.style.setProperty(spacing.variable, remValue);

      // Get the spacing number for this variable
      const spaceNum = spacingMap[spacing.variable];
      if (spaceNum) {
        // Apply to the actual CSS variables used in main.css based on selection
        if (spacingTarget.value === 'margin' || spacingTarget.value === 'all') {
          componentPreview.value.style.setProperty(`--margin-${spaceNum}`, remValue);
        }

        if (spacingTarget.value === 'padding' || spacingTarget.value === 'all') {
          componentPreview.value.style.setProperty(`--padding-${spaceNum}`, remValue);
        }

        if (spacingTarget.value === 'gap' || spacingTarget.value === 'all') {
          componentPreview.value.style.setProperty(`--gap-${spaceNum}`, remValue);
        }
      }
    });
  }
};

// Update individual spacing variable (for manual overrides)
const updateIndividualSpacing = (index: number, value: number) => {
  spacingVariables.value[index].computedValue = value;
  updateAllSpacingVariables();
};

// Handle multiplier change
const onMultiplierChange = () => {
  computeSpacingValues();
  updateAllSpacingVariables();
};

// Reset spacing multiplier to default
const resetSpacingMultiplier = () => {
  spacingMultiplier.value = 1;
  onMultiplierChange();
};

// Reset all individual values to computed values
const resetToComputedValues = () => {
  computeSpacingValues();
  updateAllSpacingVariables();
};

// Update all spacing variables when target changes
const onSpacingTargetChange = () => {
  updateAllSpacingVariables();
};

// Initialize spacing variables when component mounts
onMounted(() => {
  // Wait for next tick to ensure component preview is rendered
  nextTick(() => {
    computeSpacingValues();
    updateAllSpacingVariables();
  });
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <StandardHeader
      title="UI Byggstenar"
      :breadcrumbs="[
        { label: 'Dashboard', to: '/overview' },
        { label: 'Utveckling', to: '/development' },
        { label: 'UI Byggstenar', isCurrentPage: true },
      ]"
      :show-stats="true"
      :stats="[
        { label: 'Komponenter', value: componentCount, color: 'text-blue-600' },
        { label: 'Sidor', value: pageCount, color: 'text-green-600' },
        { label: 'UI Bibliotek', value: uiComponentCount, color: 'text-purple-600' },
        { label: 'Viewports', value: 3, color: 'text-orange-600' },
      ]"
    />

    <div class="px-6 pb-6">
      <!-- Toggle Section -->
      <div class="mb-6 bg-white rounded-lg border p-4">
        <div class="flex gap-2">
          <Button
            :variant="currentView === 'components' ? 'default' : 'outline'"
            class="gap-2"
            @click="currentView = 'components'"
          >
            <FileText class="h-4 w-4" />
            Komponenter
          </Button>
          <Button
            :variant="currentView === 'toasts' ? 'default' : 'outline'"
            class="gap-2"
            @click="currentView = 'toasts'"
          >
            🍞 Toast Exempel
          </Button>
        </div>
      </div>

      <!-- Content Area -->
      <ToastExample v-if="currentView === 'toasts'" />
      <div v-else class="flex h-[calc(100vh-200px)]">
        <!-- File Tree Sidebar -->
        <div class="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div class="p-4">
            <!-- Viewport Controls -->
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-900 mb-3">Viewport</h3>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  :class="[
                    'flex items-center gap-2',
                    currentViewport === 'desktop' ? 'bg-blue-100 border-blue-300' : '',
                  ]"
                  @click="setViewport('desktop')"
                >
                  <Monitor class="w-4 h-4" />
                  Desktop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  :class="[
                    'flex items-center gap-2',
                    currentViewport === 'laptop' ? 'bg-blue-100 border-blue-300' : '',
                  ]"
                  @click="setViewport('laptop')"
                >
                  <Laptop class="w-4 h-4" />
                  Laptop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  :class="[
                    'flex items-center gap-2',
                    currentViewport === 'phone' ? 'bg-blue-100 border-blue-300' : '',
                  ]"
                  @click="setViewport('phone')"
                >
                  <Smartphone class="w-4 h-4" />
                  Phone
                </Button>
              </div>
            </div>

            <h3 class="text-sm font-semibold text-gray-900 mb-3">pages</h3>

            <!-- Pages Section -->
            <div class="mb-6">
              <template v-for="node in fileTree.filter(n => n.name === 'pages')" :key="node.path">
                <!-- Folder -->
                <div v-if="node.type === 'folder'">
                  <button
                    class="flex items-center w-full px-2 py-1 text-sm text-left text-gray-700 hover:bg-gray-100 rounded"
                    @click="toggleFolder(node.path)"
                  >
                    <ChevronRight
                      v-if="!isExpanded(node.path)"
                      class="w-4 h-4 mr-1 text-gray-400"
                    />
                    <ChevronDown v-else class="w-4 h-4 mr-1 text-gray-400" />
                    <Folder v-if="!isExpanded(node.path)" class="w-4 h-4 mr-2 text-blue-500" />
                    <FolderOpen v-else class="w-4 h-4 mr-2 text-blue-500" />
                    {{ node.name }}
                  </button>

                  <!-- Children -->
                  <div v-if="isExpanded(node.path)" class="ml-4 mt-1 space-y-1">
                    <template v-for="child in node.children" :key="child.path">
                      <button
                        :class="[
                          'flex items-center w-full px-2 py-1 text-sm text-left rounded',
                          selectedComponent?.path === child.path
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100',
                        ]"
                        @click="selectComponent(child)"
                      >
                        <FileText class="w-4 h-4 mr-2 text-gray-400" />
                        {{ child.name }}
                      </button>
                    </template>
                  </div>
                </div>
              </template>
            </div>

            <h3 class="text-sm font-semibold text-gray-900 mb-3">@/components</h3>

            <!-- Recursive Tree Component -->
            <div class="space-y-1">
              <template v-for="node in fileTree.filter(n => n.name !== 'pages')" :key="node.path">
                <!-- Folder -->
                <div v-if="node.type === 'folder'">
                  <button
                    class="flex items-center w-full px-2 py-1 text-sm text-left text-gray-700 hover:bg-gray-100 rounded"
                    @click="toggleFolder(node.path)"
                  >
                    <ChevronRight
                      v-if="!isExpanded(node.path)"
                      class="w-4 h-4 mr-1 text-gray-400"
                    />
                    <ChevronDown v-else class="w-4 h-4 mr-1 text-gray-400" />
                    <Folder v-if="!isExpanded(node.path)" class="w-4 h-4 mr-2 text-blue-500" />
                    <FolderOpen v-else class="w-4 h-4 mr-2 text-blue-500" />
                    {{ node.name }}
                  </button>

                  <!-- Children -->
                  <div v-if="isExpanded(node.path)" class="ml-4 mt-1 space-y-1">
                    <template v-for="child in node.children" :key="child.path">
                      <!-- Nested Folder -->
                      <div v-if="child.type === 'folder'">
                        <button
                          class="flex items-center w-full px-2 py-1 text-sm text-left text-gray-700 hover:bg-gray-100 rounded"
                          @click="toggleFolder(child.path)"
                        >
                          <ChevronRight
                            v-if="!isExpanded(child.path)"
                            class="w-4 h-4 mr-1 text-gray-400"
                          />
                          <ChevronDown v-else class="w-4 h-4 mr-1 text-gray-400" />
                          <Folder
                            v-if="!isExpanded(child.path)"
                            class="w-4 h-4 mr-2 text-blue-500"
                          />
                          <FolderOpen v-else class="w-4 h-4 mr-2 text-blue-500" />
                          {{ child.name }}
                        </button>

                        <!-- Nested Children -->
                        <div v-if="isExpanded(child.path)" class="ml-4 mt-1 space-y-1">
                          <button
                            v-for="grandchild in child.children"
                            :key="grandchild.path"
                            :class="[
                              'flex items-center w-full px-2 py-1 text-sm text-left rounded',
                              selectedComponent?.path === grandchild.path
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100',
                            ]"
                            @click="selectComponent(grandchild)"
                          >
                            <FileText class="w-4 h-4 mr-2 text-gray-400" />
                            {{ grandchild.name }}
                          </button>
                        </div>
                      </div>

                      <!-- Direct File -->
                      <button
                        v-else
                        :class="[
                          'flex items-center w-full px-2 py-1 text-sm text-left rounded',
                          selectedComponent?.path === child.path
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100',
                        ]"
                        @click="selectComponent(child)"
                      >
                        <FileText class="w-4 h-4 mr-2 text-gray-400" />
                        {{ child.name }}
                      </button>
                    </template>
                  </div>
                </div>

                <!-- Root Level File -->
                <button
                  v-else
                  :class="[
                    'flex items-center w-full px-2 py-1 text-sm text-left rounded',
                    selectedComponent?.path === node.path
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100',
                  ]"
                  @click="selectComponent(node)"
                >
                  <FileText class="w-4 h-4 mr-2 text-gray-400" />
                  {{ node.name }}
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- Component Renderer -->
        <div class="flex-1 overflow-y-auto bg-gray-100">
          <div v-if="selectedComponent" class="p-6">
            <div class="mb-4">
              <h2 class="text-xl font-semibold text-gray-900">{{ selectedComponent.name }}</h2>
              <p class="text-sm text-gray-500">
                {{ selectedComponent.path.startsWith('pages/') ? '@/views/' : '@/components/'
                }}{{ selectedComponent.path }}
              </p>
              <p class="text-xs text-gray-400 mt-1">
                {{ currentViewport.charAt(0).toUpperCase() + currentViewport.slice(1) }} View
              </p>
            </div>

            <!-- Component Preview with Viewport Styling -->
            <div class="flex justify-center">
              <div
                ref="componentPreview"
                :style="viewportStyles"
                class="bg-white border border-gray-300 shadow-lg overflow-auto"
              >
                <!-- Special handling for DataTable to show action buttons -->
                <DataTable
                  v-if="selectedComponent.name === 'DataTable.vue'"
                  v-bind="selectedComponent.props || {}"
                >
                  <template #row-actions="{ row }">
                    <div class="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Visa användare"
                        class="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        @click="
                          event => {
                            event.stopPropagation();
                            console.log('View user:', row);
                          }
                        "
                      >
                        <User class="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Redigera"
                        class="h-6 w-6 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        @click="
                          event => {
                            event.stopPropagation();
                            console.log('Edit user:', row);
                          }
                        "
                      >
                        <Edit class="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Radera"
                        class="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        @click="
                          event => {
                            event.stopPropagation();
                            console.log('Delete user:', row);
                          }
                        "
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </template>
                </DataTable>

                <!-- Special handling for ComplexDetailPage to enable field editing -->
                <ComplexDetailPage
                  v-else-if="selectedComponent.name === 'ComplexDetailPage.vue'"
                  v-bind="selectedComponent.props || {}"
                  @field-change="handleFieldChange"
                  @save="handleSave"
                  @delete="handleDelete"
                  @back="handleBack"
                  @discard-changes="handleDiscardChanges"
                  @add-sub-item="handleAddSubItem"
                  @edit-sub-item="handleEditSubItem"
                  @delete-sub-item="handleDeleteSubItem"
                  @sub-item-click="handleSubItemClick"
                />

                <!-- Special handling for ListPage to show custom slots -->
                <ListPage
                  v-else-if="selectedComponent.name === 'ListPage.vue'"
                  v-bind="selectedComponent.props || {}"
                >
                  <template #cell-status="{ row }">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        row.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800',
                      ]"
                    >
                      {{ row.status === 'active' ? 'Aktiv' : 'Inaktiv' }}
                    </span>
                  </template>
                  <template #row-actions="{ row }">
                    <div class="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Visa objekt"
                        class="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        @click="
                          event => {
                            event.stopPropagation();
                            console.log('View object:', row);
                          }
                        "
                      >
                        <User class="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Redigera"
                        class="h-6 w-6 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        @click="
                          event => {
                            event.stopPropagation();
                            console.log('Edit object:', row);
                          }
                        "
                      >
                        <Edit class="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Radera"
                        class="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        @click="
                          event => {
                            event.stopPropagation();
                            console.log('Delete object:', row);
                          }
                        "
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </template>
                </ListPage>

                <!-- Default component rendering for all other components -->
                <component
                  :is="selectedComponent.component"
                  v-else
                  v-bind="selectedComponent.props || {}"
                />
              </div>
            </div>

            <!-- Spacing Variables Editor -->
            <div class="mt-8 bg-white border border-gray-300 rounded-lg shadow-sm">
              <div class="border-b border-gray-200 px-6 py-4">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">Spacing Variables Editor</h3>
                  <div class="flex items-center gap-2">
                    <h3 class="text-m font-semibold text-blue-900 mb-2">Spacing Multiplier</h3>
                    <input
                      v-model="spacingMultiplier"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      class="w-20 px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      @input="onMultiplierChange"
                    />
                  </div>
                  <!-- Spacing Target Selector -->
                  <div class="mt-4 sm:mt-0">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Apply to:</label>
                    <select
                      v-model="spacingTarget"
                      class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      @change="onSpacingTargetChange"
                    >
                      <option value="all">All (Margin, Padding & Gap)</option>
                      <option value="margin">Margin Only</option>
                      <option value="padding">Padding Only</option>
                      <option value="gap">Gap Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="p-6">
                <!-- Individual Controls Section -->
                <div class="border-t border-gray-200 pt-6">
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <h4 class="text-md font-semibold text-gray-900">
                        Individual Spacing Controls
                      </h4>
                      <p class="text-sm text-gray-600 mt-1">
                        Fine-tune individual spacing values. Changes override the algebraic
                        multiplier for specific values.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      class="flex items-center gap-2"
                      @click="resetToComputedValues"
                    >
                      <Settings class="h-3 w-3" />
                      Reset to Computed
                    </Button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div
                      v-for="(spacing, index) in spacingVariables"
                      :key="spacing.name"
                      class="space-y-2"
                    >
                      <label class="block text-sm font-medium text-gray-700">
                        {{ spacing.name }} ({{ spacing.variable }})
                      </label>
                      <div class="flex items-center space-x-2">
                        <input
                          :value="spacing.computedValue"
                          type="number"
                          step="0.25"
                          min="0"
                          max="20"
                          class="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          @input="
                            updateIndividualSpacing(index, parseFloat($event.target.value) || 0)
                          "
                        />
                        <span class="text-sm text-gray-500">rem</span>
                        <div class="flex-1">
                          <div
                            class="h-4 bg-blue-500 rounded"
                            :style="{
                              width: `${spacing.computedValue * 20 > 100 ? 100 : spacing.computedValue * 20}%`,
                            }"
                          ></div>
                        </div>
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ Math.round(spacing.computedValue * 16) }}px
                      </div>
                      <div class="text-xs text-blue-600">
                        Base: {{ spacing.baseValue }}rem × {{ spacingMultiplier }} =
                        {{ (spacing.baseValue * spacingMultiplier).toFixed(2) }}rem
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Usage Examples -->
                <div class="mt-8 border-t border-gray-200 pt-6">
                  <h4 class="text-md font-semibold text-gray-900 mb-4">Usage Examples</h4>
                  <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-800">
                      <strong>Current Target:</strong>
                      <span v-if="spacingTarget === 'all'">
                        All margin, padding, and gap utilities will be affected
                      </span>
                      <span v-else-if="spacingTarget === 'margin'">
                        Only margin utilities (m-, mx-, my-, mt-, mr-, mb-, ml-) will be affected
                      </span>
                      <span v-else-if="spacingTarget === 'padding'">
                        Only padding utilities (p-, px-, py-, pt-, pr-, pb-, pl-) will be affected
                      </span>
                      <span v-else>Only gap utilities (gap-, gap-x-, gap-y-) will be affected</span>
                    </p>
                  </div>

                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Margin Examples -->
                    <div
                      v-if="spacingTarget === 'all' || spacingTarget === 'margin'"
                      class="space-y-4"
                    >
                      <h5 class="text-sm font-medium text-gray-700">Margin Examples</h5>
                      <div class="space-y-3">
                        <div
                          v-for="example in marginExamples"
                          :key="example.class"
                          class="flex items-center space-x-3"
                        >
                          <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {{ example.class }}
                          </code>
                          <div class="flex-1">
                            <div class="bg-gray-200 p-1 rounded">
                              <div :class="example.class" class="bg-blue-500 w-8 h-8 rounded"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Padding Examples -->
                    <div
                      v-if="spacingTarget === 'all' || spacingTarget === 'padding'"
                      class="space-y-4"
                    >
                      <h5 class="text-sm font-medium text-gray-700">Padding Examples</h5>
                      <div class="space-y-3">
                        <div
                          v-for="example in paddingExamples"
                          :key="example.class"
                          class="flex items-center space-x-3"
                        >
                          <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {{ example.class }}
                          </code>
                          <div class="flex-1">
                            <div :class="example.class" class="bg-blue-500 rounded">
                              <div class="bg-white w-8 h-8 rounded"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Gap Examples -->
                    <div
                      v-if="spacingTarget === 'all' || spacingTarget === 'gap'"
                      class="space-y-4"
                    >
                      <h5 class="text-sm font-medium text-gray-700">Gap Examples</h5>
                      <div class="space-y-3">
                        <div
                          v-for="example in gapExamples"
                          :key="example.class"
                          class="flex items-center space-x-3"
                        >
                          <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {{ example.class }}
                          </code>
                          <div class="flex-1">
                            <div :class="['flex', example.class]" class="bg-gray-200 p-1 rounded">
                              <div class="bg-blue-500 w-4 h-4 rounded"></div>
                              <div class="bg-blue-500 w-4 h-4 rounded"></div>
                              <div class="bg-blue-500 w-4 h-4 rounded"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Reset Button -->
                <div class="mt-6 flex justify-end">
                  <Button
                    variant="outline"
                    class="flex items-center gap-2"
                    @click="resetSpacingMultiplier"
                  >
                    <Settings class="h-4 w-4" />
                    Reset Multiplier (1×)
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex items-center justify-center h-full">
            <div class="text-center">
              <FileText class="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 class="text-lg font-medium text-gray-900 mb-2">Select a Component</h3>
              <p class="text-gray-500">Choose a component from the file tree to preview it here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Custom styles if needed */
</style>
