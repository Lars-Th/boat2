<template>
  <PageLayout title="Redskap" breadcrumbs="Dashboard / Redskap" show-stats :stats="stats">
    <!-- Actions with padding -->
    <div class="px-6 py-4 flex justify-end">
      <Button class="gap-2" @click="handleNewTool">
        <Plus class="h-4 w-4" />
        Nytt redskap
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar redskap...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <p class="text-destructive mb-2">Ett fel uppstod vid laddning av redskap</p>
        <Button
          variant="outline"
          @click="
            () => {
              /* Add refresh logic */
            }
          "
        >
          Försök igen
        </Button>
      </div>
    </div>

    <!-- DataTable -->
    <DataTable
      v-else
      :data="processedTools"
      :columns="columns"
      :search-fields="['Name', 'ToolNumber', 'Type', 'Brand', 'Model', 'Location', 'AssignedTo']"
      @row-click="handleRowClick"
    >
      <template #cell-Status="{ value }">
        <Badge :variant="getStatusVariant(value)">
          {{ getStatusLabel(value) }}
        </Badge>
      </template>

      <template #cell-LocationAssigned="{ row }">
        <div v-if="row.Status === 'assigned'" class="flex items-center gap-2">
          <User class="h-4 w-4 text-muted-foreground" />
          {{ row.AssignedTo }}
        </div>
        <div v-else class="flex items-center gap-2">
          <MapPin class="h-4 w-4 text-muted-foreground" />
          {{ row.Location }}
        </div>
      </template>

      <template #cell-LastServiceDate="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #cell-NextServiceDate="{ value }">
        <span :class="getServiceDateClass(value)">
          {{ formatDate(value) }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex gap-2">
          <Button size="sm" variant="outline" @click="handleViewTool(row)">Visa</Button>
          <Button size="sm" variant="outline" @click="handleEditTool(row)">Redigera</Button>
          <Button
            v-if="row.Status === 'available'"
            size="sm"
            variant="outline"
            @click="handleAssignTool(row)"
          >
            Tilldela
          </Button>
          <Button
            v-if="row.Status === 'assigned'"
            size="sm"
            variant="outline"
            @click="handleReturnTool(row)"
          >
            Återlämna
          </Button>
        </div>
      </template>
    </DataTable>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Plus, User, UserMinus, UserPlus, Wrench } from 'lucide-vue-next';

const router = useRouter();
const typeFilter = ref('');
const locationFilter = ref('');

// Fetch tools using the API service
const {
  data: tools,
  loading: toolsLoading,
  error: toolsError,
} = useApiList(() => api.tools.getAll(), {
  cacheKey: 'tools',
});

// Process tools with additional computed fields
const processedTools = computed(() => {
  if (!tools.value) return [];

  return tools.value.map((tool: any) => ({
    ...tool,
    BrandModel: `${tool.Brand} ${tool.Model}`,
  }));
});

// Loading state
const isLoading = computed(() => toolsLoading.value);

// Error state
const hasError = computed(() => toolsError.value !== null);

// Table columns
const columns = [
  { key: 'ToolNumber', label: 'Verktygsnummer', sortable: true, width: '140px' },
  { key: 'Name', label: 'Namn', sortable: true },
  { key: 'Type', label: 'Typ', sortable: true },
  { key: 'BrandModel', label: 'Märke/Modell', sortable: true },
  {
    key: 'Status',
    label: 'Status',
    sortable: true,
    type: 'badge',
    badgeVariant: (value: string) => {
      switch (value) {
        case 'available':
          return 'default';
        case 'assigned':
          return 'secondary';
        case 'under_repair':
          return 'destructive';
        default:
          return 'secondary';
      }
    },
  },
  { key: 'LocationAssigned', label: 'Plats/Tilldelad', sortable: true, type: 'custom' },
  { key: 'LastServiceDate', label: 'Senaste service', sortable: true, type: 'custom' },
  { key: 'NextServiceDate', label: 'Nästa service', sortable: true, type: 'custom' },
  { key: 'actions', label: 'Åtgärder', type: 'actions', width: '160px', align: 'right' },
];

// Statistics
const stats = computed(() => {
  if (!tools.value) {
    return [
      { title: 'Totalt', value: 0, icon: Wrench, color: 'blue' },
      { title: 'Tillgängliga', value: 0, icon: Wrench, color: 'green' },
      { title: 'Tilldelade', value: 0, icon: User, color: 'purple' },
      { title: 'Under reparation', value: 0, icon: Wrench, color: 'red' },
    ];
  }

  const availableTools = tools.value.filter((t: any) => t.Status === 'available').length;
  const assignedTools = tools.value.filter((t: any) => t.Status === 'assigned').length;
  const repairTools = tools.value.filter((t: any) => t.Status === 'under_repair').length;

  return [
    {
      title: 'Totalt',
      value: tools.value.length,
      icon: Wrench,
      color: 'blue',
    },
    {
      title: 'Tillgängliga',
      value: availableTools,
      icon: Wrench,
      color: 'green',
    },
    {
      title: 'Tilldelade',
      value: assignedTools,
      icon: User,
      color: 'purple',
    },
    {
      title: 'Under reparation',
      value: repairTools,
      icon: Wrench,
      color: 'red',
    },
  ];
});

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sv-SE');
};

const getServiceDateClass = (dateString: string) => {
  if (!dateString) return '';

  const serviceDate = new Date(dateString);
  const today = new Date();
  const diffDays = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'text-red-600 font-medium'; // Försenad
  if (diffDays <= 30) return 'text-orange-600 font-medium'; // Inom 30 dagar
  return 'text-green-600'; // Mer än 30 dagar
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'available':
      return 'default';
    case 'assigned':
      return 'secondary';
    case 'under_repair':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'available':
      return 'Tillgänglig';
    case 'assigned':
      return 'Tilldelad';
    case 'under_repair':
      return 'Under reparation';
    default:
      return status;
  }
};

// Event handlers
const handleNewTool = () => {
  router.push('/tools/new');
};

const handleRowClick = (tool: any) => {
  router.push(`/tools/${tool.ToolID}`);
};

const handleViewTool = (tool: any) => {
  router.push(`/tools/${tool.ToolID}`);
};

const handleEditTool = (tool: any) => {
  router.push(`/tools/${tool.ToolID}/edit`);
};

const handleAssignTool = (tool: any) => {
  router.push(`/tools/${tool.ToolID}/assign`);
};

const handleReturnTool = (tool: any) => {
  router.push(`/tools/${tool.ToolID}/return`);
};
</script>
