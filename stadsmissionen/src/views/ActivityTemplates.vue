<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import SearchAndFilter from '@/components/shared/SearchAndFilter.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Eye, FileText, MessageSquare, Plus, Trash2, Users } from 'lucide-vue-next';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import type { ActivityType } from '@/types';

const router = useRouter();
const searchTerm = ref('');

// Fetch data using API service
const {
  data: activityTemplates,
  loading: templatesLoading,
  error: templatesError,
  refresh: refreshTemplates,
} = useApiList(() => api.activityTemplates.getAll(), {
  cacheKey: 'activityTemplates',
});

const {
  data: activityTypes,
  loading: activityTypesLoading,
  error: activityTypesError,
  refresh: refreshActivityTypes,
} = useApiList<ActivityType>(() => api.activityTypes.getAll(), {
  cacheKey: 'activityTypes',
});

// Loading and error states
const isLoading = computed(() => templatesLoading.value || activityTypesLoading.value);
const hasError = computed(() => templatesError.value !== null || activityTypesError.value !== null);

// Refresh function for error recovery
const handleRefresh = async () => {
  await Promise.all([refreshTemplates(), refreshActivityTypes()]);
};

// Get activity type details
const getActivityTypeDetails = (typeIds: string[]) => {
  if (!activityTypes.value) return [];

  return typeIds.map(id => {
    const type = activityTypes.value?.find(t => t.ActivityTypeID.toString() === id);
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

// Enhanced templates with calculated data
const enhancedTemplates = computed(() => {
  if (!activityTemplates.value) return [];

  return activityTemplates.value.map(template => {
    const types = getActivityTypeDetails(template.aktivitetstyper);
    const primaryPurpose = types.length > 0 && types[0] ? types[0].Syfte : 'Inget syfte angivet';

    return {
      ...template,
      types,
      primaryPurpose,
      questionCount: template.resultatformular.length,
      durationHours: Math.floor(template.standardVaraktighet / 60),
      durationMinutes: template.standardVaraktighet % 60,
    };
  });
});

// Filter templates based on search
const filteredTemplates = computed(() => {
  if (!searchTerm.value) return enhancedTemplates.value;

  const search = searchTerm.value.toLowerCase();
  return enhancedTemplates.value.filter(
    template =>
      template.namn.toLowerCase().includes(search) ||
      template.beskrivning.toLowerCase().includes(search) ||
      template.malltyp.toLowerCase().includes(search) ||
      template.types.some(type => type.Typnamn.toLowerCase().includes(search))
  );
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

// Statistics
const stats = computed(() => {
  if (!activityTemplates.value) {
    return [
      { title: 'Totalt mallar', value: 0, icon: FileText, color: 'blue' },
      { title: 'Standard-mallar', value: 0, icon: Users, color: 'green' },
      { title: 'Samtal-mallar', value: 0, icon: MessageSquare, color: 'purple' },
      { title: 'Öppet hus-mallar', value: 0, icon: FileText, color: 'orange' },
    ];
  }

  return [
    {
      title: 'Totalt mallar',
      value: activityTemplates.value.length,
      icon: FileText,
      color: 'blue',
    },
    {
      title: 'Standard-mallar',
      value: activityTemplates.value.filter(t => t.malltyp === 'Standard').length,
      icon: Users,
      color: 'green',
    },
    {
      title: 'Samtal-mallar',
      value: activityTemplates.value.filter(t => t.malltyp === 'Samtal').length,
      icon: MessageSquare,
      color: 'purple',
    },
    {
      title: 'Öppet hus-mallar',
      value: activityTemplates.value.filter(t => t.malltyp === 'OppetHus').length,
      icon: FileText,
      color: 'orange',
    },
  ];
});

// Filters
const filters = [
  {
    key: 'malltyp',
    label: 'Malltyp',
    options: [
      { value: 'Standard', label: 'Standard' },
      { value: 'Samtal', label: 'Samtal' },
      { value: 'OppetHus', label: 'Öppet hus' },
    ],
  },
  {
    key: 'duration',
    label: 'Varaktighet',
    options: [
      { value: 'short', label: 'Kort (< 1h)' },
      { value: 'medium', label: 'Medium (1-2h)' },
      { value: 'long', label: 'Lång (> 2h)' },
    ],
  },
];

// Actions
const handleNewTemplate = () => {
  router.push('/activity-templates/new');
};

const handleRowClick = (template: Record<string, unknown>) => {
  // Navigate to template detail view
  router.push(`/activity-templates/${template['id']}`);
};

const handleEditTemplate = (template: Record<string, unknown>, event: Event) => {
  event.stopPropagation();
  // Navigate to edit template (same as new template but with data)
  router.push(`/activity-templates/${template['id']}/edit`);
};

const handleDeleteTemplate = (template: Record<string, unknown>, event: Event) => {
  event.stopPropagation();
  if (confirm(`Är du säker på att du vill ta bort mallen "${template['namn']}"?`)) {
    // TODO: Implement actual delete API call
    console.log('Delete template:', template['id']);
    // For now, just log the action
  }
};

const handleViewTemplate = (template: Record<string, unknown>, event: Event) => {
  event.stopPropagation();
  // Navigate to template detail view
  router.push(`/activity-templates/${template['id']}`);
};
</script>

<template>
  <PageLayout
    title="Aktivitetsmallar"
    breadcrumbs="Dashboard / Administration / Aktivitetsmallar"
    show-stats
    :stats="stats"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar aktivitetsmallar...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <p class="text-destructive mb-2">Ett fel uppstod vid laddning av aktivitetsmallar</p>
        <Button variant="outline" @click="handleRefresh">Försök igen</Button>
      </div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- SearchAndFilter with padding -->
      <div class="px-6 py-4">
        <SearchAndFilter
          v-model:search="searchTerm"
          :filters="filters"
          placeholder="Sök aktivitetsmallar..."
        >
          <template #actions>
            <Button class="gap-2" @click="handleNewTemplate">
              <Plus class="h-4 w-4" />
              Ny mall
            </Button>
          </template>
        </SearchAndFilter>
      </div>

      <!-- Empty State -->
      <div
        v-if="!activityTemplates || activityTemplates.length === 0"
        class="flex items-center justify-center py-12"
      >
        <div class="text-center">
          <FileText class="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p class="text-muted-foreground mb-4">Inga aktivitetsmallar tillgängliga</p>
          <Button @click="handleNewTemplate">
            <Plus class="h-4 w-4 mr-2" />
            Skapa första mallen
          </Button>
        </div>
      </div>

      <!-- DataTable full width -->
      <DataTable
        v-else
        :data="filteredTemplates"
        :columns="columns"
        class="cursor-pointer"
        @row-click="handleRowClick"
      >
        <!-- Custom column renderers -->
        <template #cell-malltyp="{ row }">
          <div class="flex items-center gap-2">
            <component
              :is="getTemplateTypeInfo(String(row['malltyp'])).icon"
              class="h-4 w-4"
              :class="`text-${getTemplateTypeInfo(String(row['malltyp'])).color}-600`"
            />
            <Badge
              :variant="
                String(row['malltyp']) === 'Standard'
                  ? 'default'
                  : String(row['malltyp']) === 'Samtal'
                    ? 'secondary'
                    : 'outline'
              "
              class="text-xs"
            >
              {{ getTemplateTypeInfo(String(row['malltyp'])).label }}
            </Badge>
          </div>
        </template>

        <template #cell-types="{ row }">
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="type in (row['types'] as ActivityType[])?.slice(0, 2) || []"
              :key="type.ActivityTypeID"
              variant="outline"
              class="text-xs"
              :title="`${type.Syfte}\n\n${type.Beskrivning}`"
            >
              {{ type.Typnamn }}
            </Badge>
            <Badge
              v-if="(row['types'] as ActivityType[])?.length > 2"
              variant="outline"
              class="text-xs"
            >
              +{{ (row['types'] as ActivityType[]).length - 2 }}
            </Badge>
          </div>
        </template>

        <template #cell-beskrivning="{ row }">
          <div class="text-xs text-muted-foreground">
            {{ row['beskrivning'] }}
          </div>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              title="Visa mall"
              @click="event => handleViewTemplate(row, event)"
            >
              <Eye class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              title="Redigera mall"
              @click="event => handleEditTemplate(row, event)"
            >
              <Edit class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Ta bort mall"
              @click="event => handleDeleteTemplate(row, event)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </template>
      </DataTable>

      <!-- Quick info cards -->
      <div class="px-6 py-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium flex items-center gap-2">
                <Users class="h-4 w-4 text-blue-600" />
                Standard-mallar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-xs text-muted-foreground">
                För aktiviteter med specifika deltagare som bjuds in. Kan vara engångs- eller
                serieaktiviteter.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium flex items-center gap-2">
                <MessageSquare class="h-4 w-4 text-green-600" />
                Samtal-mallar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-xs text-muted-foreground">
                För individuella eller gruppsamtal med fokus på dokumentation och uppföljning.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium flex items-center gap-2">
                <FileText class="h-4 w-4 text-purple-600" />
                Öppet hus-mallar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-xs text-muted-foreground">
                För öppna aktiviteter utan förhandsanmälan. Anonymt besöksräkning och feedback.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>
  </PageLayout>
</template>
