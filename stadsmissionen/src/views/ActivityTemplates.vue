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

// Import data
import activityTemplatesData from '@/assets/data/activityTemplates.json';
import activityTypesData from '@/assets/data/activityTypes.json';

// Define proper interfaces
interface ActivityType {
  ActivityTypeID: number;
  Typnamn: string;
  Beskrivning: string;
  Syfte: string;
}

const router = useRouter();
const searchTerm = ref('');

// Get activity type details
const getActivityTypeDetails = (typeIds: string[]) => {
  return typeIds.map(id => {
    const type = activityTypesData.find(t => t.ActivityTypeID.toString() === id);
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
  return activityTemplatesData.map(template => {
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
const stats = computed(() => [
  {
    title: 'Totalt mallar',
    value: activityTemplatesData.length,
    icon: FileText,
    color: 'blue',
  },
  {
    title: 'Standard-mallar',
    value: activityTemplatesData.filter(t => t.malltyp === 'Standard').length,
    icon: Users,
    color: 'green',
  },
  {
    title: 'Samtal-mallar',
    value: activityTemplatesData.filter(t => t.malltyp === 'Samtal').length,
    icon: MessageSquare,
    color: 'purple',
  },
  {
    title: 'Öppet hus-mallar',
    value: activityTemplatesData.filter(t => t.malltyp === 'OppetHus').length,
    icon: FileText,
    color: 'orange',
  },
]);

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
    const index = activityTemplatesData.findIndex(t => t.id === template['id']);
    if (index > -1) {
      activityTemplatesData.splice(index, 1);
      console.log('Deleted template:', template['id']);
    }
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

    <!-- DataTable full width -->
    <DataTable
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
  </PageLayout>
</template>
