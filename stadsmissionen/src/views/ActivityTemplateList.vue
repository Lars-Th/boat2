<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import ListPage from '@/components/shared/ListPage.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, FileText, MessageSquare, Plus, Trash2, Users } from 'lucide-vue-next';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import type { ActivityTemplate, ActivityType } from '@/types';

const router = useRouter();

// Filter and search state
const searchQuery = ref('');
const statusFilter = ref('all');

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Reset pagination when filters change
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1;
});

// Fetch data using enhanced API with relational data
const {
  data: activityTemplates,
  loading: templatesLoading,
  error: templatesError,
  refresh: refreshTemplates,
} = useApiList<ActivityTemplate>(() => api.activityTemplates.getAll(), {
  cacheKey: 'activityTemplatesWithRelations',
});

const {
  data: activityTypes,
  loading: typesLoading,
  error: typesError,
  refresh: refreshTypes,
} = useApiList<ActivityType>(() => api.activityTypes.getAll(), {
  cacheKey: 'activityTypes',
});

// Loading and error states
const isLoading = computed(() => Boolean(templatesLoading.value) || Boolean(typesLoading.value));
const hasError = computed(() => templatesError.value !== null || typesError.value !== null);

// Refresh function for error recovery
const handleRefresh = async () => {
  await Promise.all([refreshTemplates(), refreshTypes()]);
};

// Get activity type details from relational data or fallback to separate types
const getActivityTypeDetails = (typeIds: string[]) => {
  if (!activityTypes.value) return [];
  return typeIds.map(id => {
    const type = activityTypes.value?.find(t => t.ActivityTypeID === parseInt(id));
    return (
      type ?? {
        ActivityTypeID: id,
        Typnamn: 'Okänd typ',
        Syfte: '',
        Beskrivning: '',
      }
    );
  });
};

// Enhanced templates with calculated data from relations
const enhancedTemplates = computed(() => {
  if (!activityTemplates.value) return [];

  return activityTemplates.value.map(template => {
    const types = getActivityTypeDetails(template.aktivitetstyper);
    const primaryPurpose =
      types.length > 0 && types[0]
        ? (types[0].Syfte ?? 'Inget syfte angivet')
        : 'Inget syfte angivet';

    // Calculate usage statistics - mock data for now since activities relation isn't available
    const usageCount = 0; // Will be populated when real API supports relations

    return {
      ...template,
      types,
      primaryPurpose,
      questionCount: template.resultatformular.length,
      durationHours: Math.floor(template.standardVaraktighet / 60),
      durationMinutes: template.standardVaraktighet % 60,
      usageCount,
    };
  });
});

// Filter templates based on search and status
const filteredTemplates = computed(() => {
  if (!enhancedTemplates.value) return [];

  let filtered = enhancedTemplates.value;

  // Apply search filter
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      template =>
        template.namn.toLowerCase().includes(search) ||
        template.beskrivning.toLowerCase().includes(search) ||
        template.malltyp.toLowerCase().includes(search) ||
        template.types.some(type => type.Typnamn.toLowerCase().includes(search))
    );
  }

  // Apply status filter
  if (statusFilter.value && statusFilter.value !== 'all') {
    filtered = filtered.filter(template => template.malltyp === statusFilter.value);
  }

  return filtered;
});

// Paginated data
const paginatedTemplates = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredTemplates.value.slice(start, end);
});

// Get template type icon and color
const getTemplateTypeInfo = (malltyp: string) => {
  switch (malltyp) {
    case 'Standard':
      return { icon: Users, color: 'blue', label: 'Standard' };
    case 'Samtal':
      return { icon: MessageSquare, color: 'green', label: 'Samtal' };
    case 'OppetHus':
      return { icon: FileText, color: 'purple', label: 'Öppet hus' };
    default:
      return { icon: FileText, color: 'gray', label: malltyp };
  }
};

// Table columns
const columns = [
  {
    key: 'namn',
    label: 'Mallnamn',
    sortable: true,
  },
  {
    key: 'malltyp',
    label: 'Typ',
    sortable: true,
    type: 'custom' as const,
  },
  {
    key: 'types',
    label: 'Aktivitetstyper',
    sortable: false,
    type: 'custom' as const,
  },
  {
    key: 'usageCount',
    label: 'Användning',
    sortable: true,
    type: 'custom' as const,
  },
  {
    key: 'beskrivning',
    label: 'Beskrivning',
    sortable: true,
    type: 'custom' as const,
  },
  {
    key: 'actions',
    label: '',
    sortable: false,
    type: 'actions' as const,
  },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/' },
  { label: 'Inställningar', to: '/settings' },
  { label: 'Aktivitetsmallar', to: '', isCurrentPage: true },
]);

// Statistics calculated from enhanced relational data - converted to ListPage format
const stats = computed(() => {
  if (!activityTemplates.value) {
    return [
      { label: 'Totalt', value: '---', color: 'text-blue-600' },
      { label: 'Standard', value: '---', color: 'text-green-600' },
      { label: 'Samtal', value: '---', color: 'text-purple-600' },
      { label: 'Öppet hus', value: '---', color: 'text-orange-600' },
    ];
  }

  const templates = activityTemplates.value;

  return [
    {
      label: 'Totalt',
      value: templates.length,
      color: 'text-blue-600',
    },
    {
      label: 'Standard',
      value: templates.filter(t => t.malltyp === 'Standard').length,
      color: 'text-green-600',
    },
    {
      label: 'Samtal',
      value: templates.filter(t => t.malltyp === 'Samtal').length,
      color: 'text-purple-600',
    },
    {
      label: 'Öppet hus',
      value: templates.filter(t => t.malltyp === 'OppetHus').length,
      color: 'text-orange-600',
    },
  ];
});

// Action buttons for ListPage
const addActions = computed(() => [
  {
    label: 'Ny mall',
    icon: Plus,
    onClick: handleNewTemplate,
    variant: 'default' as const,
  },
]);

// Filter options for ListPage
const filters = computed(() => [
  {
    modelValue: statusFilter.value,
    placeholder: 'Alla typer',
    options: [
      { key: 'all', value: 'all', label: 'Alla typer' },
      { key: 'standard', value: 'Standard', label: 'Standard' },
      { key: 'samtal', value: 'Samtal', label: 'Samtal' },
      { key: 'oppet', value: 'OppetHus', label: 'Öppet hus' },
    ],
    onChange: (value: string) => {
      statusFilter.value = value;
    },
  },
]);

// Actions
const handleNewTemplate = () => {
  router.push('/activity-templates/new');
};

const handleRowClick = (template: any) => {
  router.push(`/activity-templates/${template.id}`);
};

const handleEditTemplate = (template: any, event: MouseEvent) => {
  event.stopPropagation();
  router.push(`/activity-templates/${template.id}/edit`);
};

const handleDeleteTemplate = (template: any, event: MouseEvent) => {
  event.stopPropagation();
  if (confirm(`Är du säker på att du vill ta bort mallen "${template.namn}"?`)) {
    // TODO: Implement API call to delete template
    console.log('Delete template:', template.id);
  }
};

const handleViewTemplate = (template: any, event: MouseEvent) => {
  event.stopPropagation();
  router.push(`/activity-templates/${template.id}`);
};

// Pagination handlers
const handlePageUpdate = (page: number) => {
  currentPage.value = page;
};

const handleItemsPerPageUpdate = (newItemsPerPage: number) => {
  itemsPerPage.value = newItemsPerPage;
  currentPage.value = 1;
};
</script>

<template>
  <div>
    <ListPage
      title="Aktivitetsmallar"
      description="Hantera aktivitetsmallar och deras konfiguration"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
      :search-query="searchQuery"
      search-placeholder="Sök aktivitetsmallar..."
      :add-actions="addActions"
      :filters="filters"
      :show-view-switcher="false"
      :data="paginatedTemplates ?? []"
      :columns="columns"
      :search-fields="['namn', 'beskrivning', 'malltyp']"
      :loading="isLoading"
      :total-items="filteredTemplates.length"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :has-error="hasError"
      error-message="Ett fel uppstod vid laddning av aktivitetsmallar"
      @update:search-query="searchQuery = $event"
      @update:current-page="handlePageUpdate"
      @update:items-per-page="handleItemsPerPageUpdate"
      @row-click="handleRowClick"
      @refresh="handleRefresh"
    >
      <!-- Custom column renderers -->
      <template #cell-malltyp="{ row }">
        <div class="flex items-center gap-2">
          <component
            :is="getTemplateTypeInfo((row as any).malltyp).icon"
            class="h-4 w-4"
            :class="`text-${getTemplateTypeInfo((row as any).malltyp).color}-600`"
          />
          <Badge
            :variant="
              (row as any).malltyp === 'Standard'
                ? 'default'
                : (row as any).malltyp === 'Samtal'
                  ? 'secondary'
                  : 'outline'
            "
            class="text-xs"
          >
            {{ getTemplateTypeInfo((row as any).malltyp).label }}
          </Badge>
        </div>
      </template>

      <template #cell-types="{ row }">
        <div class="flex flex-wrap gap-1">
          <Badge
            v-for="type in ((row as any).types ?? []).slice(0, 2)"
            :key="type.ActivityTypeID"
            variant="outline"
            class="text-xs"
            :title="`${type.Syfte}\n\n${type.Beskrivning}`"
          >
            {{ type.Typnamn }}
          </Badge>
          <Badge v-if="((row as any).types ?? []).length > 2" variant="outline" class="text-xs">
            +{{ ((row as any).types ?? []).length - 2 }}
          </Badge>
        </div>
      </template>

      <template #cell-usageCount="{ row }">
        <div class="text-center">
          <Badge variant="secondary" class="text-xs">
            {{ (row as any).usageCount }} aktiviteter
          </Badge>
        </div>
      </template>

      <template #cell-beskrivning="{ row }">
        <div class="text-xs text-muted-foreground">
          {{ (row as any).beskrivning }}
        </div>
      </template>

      <template #row-actions="{ row }">
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          title="Visa mall"
          @click="event => handleViewTemplate(row, event)"
        >
          <Eye class="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          title="Redigera mall"
          @click="event => handleEditTemplate(row, event)"
        >
          <Edit class="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Ta bort mall"
          @click="event => handleDeleteTemplate(row, event)"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
      </template>
    </ListPage>
  </div>
</template>
