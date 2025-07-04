<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import StandardHeader from '@/components/layout/StandardHeader.vue';
import Button from '@/components/common/Button.vue';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Undo2 } from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'datetime-local';
  options?: { value: string; label: string }[];
  readonly?: boolean;
}

interface Tab {
  key: string;
  title: string;
  icon?: any;
}

interface Props {
  data: { [key: string]: unknown };
  readonly?: boolean;
  hasUnsavedChanges?: boolean;
  mainFields?: Field[];
  sidebarFields?: Field[];
  title?: string;
  breadcrumbs?: Array<{ label: string; to: string; isCurrentPage?: boolean }>;
  showStats?: boolean;
  stats?: Array<{ label: string; value: string | number; color?: string }>;
  tabs?: Tab[];
  defaultTab?: string;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  hasUnsavedChanges: false,
  mainFields: () => [],
  sidebarFields: () => [],
  title: '',
  breadcrumbs: () => [],
  showStats: false,
  stats: () => [],
  tabs: () => [],
  defaultTab: '',
});

const emit = defineEmits<{
  save: [];
  delete: [];
  back: [];
  'discard-changes': [];
  'field-change': [key: string, value: any];
}>();

const activeTab = ref((props.defaultTab || props.tabs[0]?.key) ?? '');

const updateField = (key: string, value: any) => {
  if (!props.readonly) {
    emit('field-change', key, value);
  }
};

const formatValue = (value: any, type?: string) => {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'date':
      if (typeof value === 'string' || typeof value === 'number') {
        return `${value}`;
      }
      return '-';
    case 'number':
      if (typeof value === 'number') {
        return `${value}`;
      }
      return `${value}`;
    default:
      return `${value}`;
  }
};

// Toast system for unsaved changes
const { warning, dismiss } = useToast();
const unsavedChangesToastId = ref<string | null>(null);

// Watch for unsaved changes and show/hide toast accordingly
watch(
  () => props.hasUnsavedChanges,
  hasChanges => {
    if (hasChanges && !props.readonly) {
      // Show toast if not already showing
      if (!unsavedChangesToastId.value) {
        unsavedChangesToastId.value = warning(
          'Du har ändrat informationen',
          'Kom ihåg att spara dina ändringar.',
          {
            persistent: true,
            position: 'top-right',
          }
        );
      }
    } else {
      // Hide toast if showing
      if (unsavedChangesToastId.value) {
        dismiss(unsavedChangesToastId.value);
        unsavedChangesToastId.value = null;
      }
    }
  },
  { immediate: true }
);

// Clean up toast on unmount
onUnmounted(() => {
  if (unsavedChangesToastId.value) {
    dismiss(unsavedChangesToastId.value);
  }
});
</script>

<template>
  <div class="relative">
    <!-- Header -->
    <StandardHeader
      :title="props.title"
      :breadcrumbs="props.breadcrumbs"
      :show-stats="props.showStats"
      :stats="props.stats"
    ></StandardHeader>

    <!-- Action Buttons Row -->
    <div class="flex items-center gap-2 mx-4 mb-4">
      <!-- Back Button (always visible) -->
      <Button variant="secondary" size="sm" @click="emit('back')">
        <ArrowLeft class="w-3 h-3" />
        Tillbaka
      </Button>

      <!-- Save Button (appears when there are changes) -->
      <Button
        v-if="!readonly && hasUnsavedChanges"
        variant="primary"
        size="sm"
        @click="emit('save')"
      >
        <Save class="h-3 w-3" />
        Spara
      </Button>

      <!-- Discard Changes Button (appears when there are changes) -->
      <Button
        v-if="!readonly && hasUnsavedChanges"
        variant="secondary"
        size="sm"
        @click="emit('discard-changes')"
      >
        <Undo2 class="h-3 w-3" />
        Ångra
      </Button>
    </div>

    <!-- Main Form Grid -->
    <div
      class="mx-4 mb-6"
      :class="sidebarFields.length > 0 ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : 'block'"
    >
      <!-- Main Content -->
      <div :class="sidebarFields.length > 0 ? 'lg:col-span-2' : 'w-full'">
        <slot name="main-content" :data="data" :readonly="readonly">
          <!-- Default form fields -->
          <div class="bg-white rounded-lg border p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="field in mainFields" :key="field.key" class="space-y-2">
                <Label class="text-sm font-medium">{{ field.label }}</Label>
                <Input
                  v-if="field.type === 'text'"
                  :model-value="(data[field.key] ?? '').toString()"
                  :readonly="readonly || field.readonly"
                  class="h-9"
                  @update:model-value="updateField(field.key, $event)"
                />
                <Input
                  v-else-if="field.type === 'number'"
                  :model-value="(data[field.key] ?? '').toString()"
                  :readonly="readonly || field.readonly"
                  type="number"
                  class="h-9"
                  @update:model-value="updateField(field.key, +$event || 0)"
                />
                <Input
                  v-else-if="field.type === 'date'"
                  :model-value="(data[field.key] ?? '').toString()"
                  :readonly="readonly || field.readonly"
                  type="date"
                  class="h-9"
                  @update:model-value="updateField(field.key, $event)"
                />
                <Input
                  v-else-if="field.type === 'datetime-local'"
                  :model-value="(data[field.key] ?? '').toString()"
                  :readonly="readonly || field.readonly"
                  type="datetime-local"
                  class="h-9"
                  @update:model-value="updateField(field.key, $event)"
                />
                <Textarea
                  v-else-if="field.type === 'textarea'"
                  :model-value="(data[field.key] ?? '').toString()"
                  :readonly="readonly || field.readonly"
                  rows="3"
                  class="resize-none"
                  @update:model-value="updateField(field.key, $event)"
                />
                <Select
                  v-else-if="field.type === 'select'"
                  :model-value="(data[field.key] ?? '').toString()"
                  :disabled="readonly || field.readonly"
                  @update:model-value="updateField(field.key, $event)"
                >
                  <SelectTrigger class="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in field.options"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </slot>
      </div>

      <!-- Sidebar Content (1/3 width) - Only show if there are sidebar fields -->
      <div v-if="sidebarFields.length > 0" class="space-y-4">
        <slot name="sidebar-content" :data="data" :readonly="readonly">
          <!-- Default sidebar -->
          <div class="bg-white rounded-lg border p-6">
            <div class="space-y-3">
              <div v-for="field in sidebarFields" :key="field.key" class="space-y-1">
                <Label class="text-sm font-medium text-muted-foreground">{{ field.label }}</Label>
                <div class="text-sm">
                  {{ formatValue(data[field.key], field.type) }}
                </div>
              </div>
            </div>
          </div>
        </slot>
      </div>
    </div>

    <!-- Tabs Section -->
    <div v-if="tabs.length > 0" class="mx-4">
      <Tabs v-model="activeTab" class="w-full">
        <TabsList
          class="grid w-full"
          :style="{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }"
        >
          <TabsTrigger
            v-for="tab in tabs"
            :key="tab.key"
            :value="tab.key"
            class="flex items-center gap-2"
          >
            <component :is="tab.icon" v-if="tab.icon" class="h-4 w-4" />
            {{ tab.title }}
          </TabsTrigger>
        </TabsList>

        <TabsContent v-for="tab in tabs" :key="tab.key" :value="tab.key" class="mt-4">
          <!-- Custom slot for each tab content -->
          <slot :name="`tab-${tab.key}`" :tab="tab">
            <!-- Default empty tab content -->
            <div class="bg-white rounded-lg border p-6">
              <p class="text-muted-foreground">Content for {{ tab.title }}</p>
            </div>
          </slot>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
