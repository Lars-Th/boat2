<script setup lang="ts">
import StandardHeader from '@/components/layout/StandardHeader.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { Button } from '@/components/ui/button';
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
import { ArrowLeft, Edit, FileText, Info, Plus, Save, Trash2, Undo2 } from 'lucide-vue-next';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
}

interface SubTable {
  key: string;
  title: string;
  icon?: any;
  data: any[];
  columns: any[];
  allowAdd?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
}

interface Props {
  title: string;
  data: Record<string, any>;
  readonly?: boolean;
  hasUnsavedChanges?: boolean;
  breadcrumbs?: any[];
  showStats?: boolean;
  stats?: any[];
  mainFields?: Field[];
  sidebarFields?: Field[];
  subTables?: SubTable[];
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  hasUnsavedChanges: false,
  breadcrumbs: () => [],
  showStats: false,
  stats: () => [],
  mainFields: () => [],
  sidebarFields: () => [],
  subTables: () => [],
});

const emit = defineEmits<{
  save: [];
  delete: [];
  back: [];
  'discard-changes': [];
  'field-change': [key: string, value: any];
  'add-sub-item': [tableKey: string];
  'edit-sub-item': [tableKey: string, item: any];
  'delete-sub-item': [tableKey: string, item: any];
  'sub-item-click': [tableKey: string, item: any];
}>();

const updateField = (key: string, value: any) => {
  if (!props.readonly) {
    emit('field-change', key, value);
  }
};

const formatValue = (value: any, type?: string) => {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString('sv-SE');
    case 'number':
      return new Intl.NumberFormat('sv-SE').format(value);
    default:
      return String(value);
  }
};
</script>
<template>
  <div class="relative">
    <!-- Persistent Toast in Top Right -->
    <Transition name="toast" appear>
      <div
        v-if="!readonly && hasUnsavedChanges"
        class="fixed top-4 right-4 z-50 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 shadow-lg max-w-sm transition-all duration-300 transform-gpu will-change-transform"
      >
        <div class="w-2 h-2 bg-amber-500 rounded-full"></div>
        <span class="text-sm text-amber-800 font-medium">Du har ändrat informationen</span>
      </div>
    </Transition>

    <!-- Header -->
    <StandardHeader
      :title="title"
      :breadcrumbs="breadcrumbs"
      :show-stats="showStats"
      :stats="stats"
    >
      <template #actions>
        <slot name="actions">
          <Button
            v-if="!readonly && hasUnsavedChanges"
            class="gap-2 h-8 text-xs"
            @click="$emit('save')"
          >
            <Save class="h-3 w-3" />
            Spara
          </Button>
          <Button variant="destructive" class="gap-2 h-8 text-xs" @click="$emit('delete')">
            <Trash2 class="h-3 w-3" />
            Radera
          </Button>
          <Button variant="outline" class="gap-2 h-8 text-xs" @click="$emit('back')">
            <ArrowLeft class="h-3 w-3" />
            Tillbaka
          </Button>
        </slot>
      </template>
    </StandardHeader>

    <!-- Back Button and Save Button -->
    <div class="flex items-center gap-3 ml-4">
      <!-- Back Button (always visible) -->
      <Button
        variant="outline"
        size="sm"
        class="h-10 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm"
        @click="$emit('back')"
      >
        <ArrowLeft class="w-3 h-3" />
        Tillbaka
      </Button>

      <!-- Save Button (appears when there are changes) -->
      <Button
        v-if="!readonly && hasUnsavedChanges"
        size="sm"
        class="h-10 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
        @click="$emit('save')"
      >
        <Save class="h-3 w-3 mr-1" />
        Spara
      </Button>

      <!-- Discard Changes Button (appears when there are changes) -->
      <Button
        v-if="!readonly && hasUnsavedChanges"
        size="sm"
        class="h-10 px-3 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-sm"
        @click="$emit('discard-changes')"
      >
        <Undo2 class="h-3 w-3 mr-1" />
        Ångra
      </Button>
    </div>

    <!-- Main Content and Sidebar -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      <!-- Main Content (2/3 width) -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Main Form -->
        <slot name="main-content" :data="data" :readonly="readonly">
          <div class="bg-white rounded-lg border p-4">
            <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600">
              <FileText class="h-4 w-4" />
              Grundläggande information
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="field in mainFields" :key="field.key" class="space-y-1">
                <Label class="text-[10px] font-medium text-gray-500">{{ field.label }}</Label>
                <Input
                  v-if="field.type === 'text'"
                  :model-value="data[field.key]"
                  :readonly="readonly"
                  class="h-8 text-xs"
                  @update:model-value="updateField(field.key, $event)"
                />
                <Input
                  v-else-if="field.type === 'number'"
                  :model-value="data[field.key]"
                  :readonly="readonly"
                  type="number"
                  class="h-8 text-xs"
                  @update:model-value="updateField(field.key, $event)"
                />
                <Input
                  v-else-if="field.type === 'date'"
                  :model-value="data[field.key]"
                  :readonly="readonly"
                  type="date"
                  class="h-8 text-xs"
                  @update:model-value="updateField(field.key, $event)"
                />
                <Textarea
                  v-else-if="field.type === 'textarea'"
                  :model-value="data[field.key]"
                  :readonly="readonly"
                  rows="3"
                  class="text-xs resize-none"
                  @update:model-value="updateField(field.key, $event)"
                />
                <Select
                  v-else-if="field.type === 'select'"
                  :model-value="data[field.key]"
                  :disabled="readonly"
                  @update:model-value="updateField(field.key, $event)"
                >
                  <SelectTrigger size="sm" class="text-xs">
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

        <!-- Sub Tables -->
        <div v-for="(table, index) in subTables" :key="index" class="bg-white rounded-lg border">
          <div class="p-4 border-b">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold flex items-center gap-2 text-gray-600">
                <component :is="table.icon" class="h-4 w-4" />
                {{ table.title }}
                <span class="text-xs text-gray-500 font-normal">
                  ({{ table.data?.length ?? 0 }})
                </span>
              </h3>
              <Button
                v-if="table.allowAdd && !readonly"
                size="sm"
                class="h-6 text-xs"
                @click="$emit('add-sub-item', table.key)"
              >
                <Plus class="h-3 w-3 mr-1" />
                Lägg till
              </Button>
            </div>
          </div>

          <div class="p-0">
            <DataTable
              :data="table.data || []"
              :columns="table.columns"
              :loading="false"
              class="text-xs border-0"
              @row-click="row => $emit('sub-item-click', table.key, row)"
            >
              <template #actions="{ row }">
                <div class="flex items-center gap-0.5">
                  <Button
                    v-if="table.allowEdit && !readonly"
                    variant="ghost"
                    size="sm"
                    title="Redigera"
                    class="h-6 w-6 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    @click="$emit('edit-sub-item', table.key, row)"
                  >
                    <Edit class="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    v-if="table.allowDelete && !readonly"
                    variant="ghost"
                    size="sm"
                    title="Radera"
                    class="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    @click="$emit('delete-sub-item', table.key, row)"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </template>
            </DataTable>
          </div>
        </div>
      </div>

      <!-- Sidebar Content (1/3 width) -->
      <div class="space-y-4">
        <slot name="sidebar-content" :data="data">
          <!-- Default sidebar -->
          <div class="bg-white rounded-lg border p-4">
            <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600">
              <Info class="h-4 w-4" />
              Information
            </h3>

            <div class="space-y-2">
              <div v-for="field in sidebarFields" :key="field.key" class="space-y-1">
                <Label class="text-[10px] font-medium text-gray-500">{{ field.label }}</Label>
                <div class="text-xs text-gray-700">
                  {{ formatValue(data[field.key], field.type) }}
                </div>
              </div>
            </div>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}
</style>
