<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import StandardHeader from '@/components/layout/StandardHeader.vue';
import Button from '@/components/common/Button.vue';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox';
import { ArrowLeft, Check, ChevronsUpDown, FileText, Info, Save, Undo2 } from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
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
  stats?: Array<{ label: string; value: string | number; color?: string; variant?: string }>;
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
});

const emit = defineEmits<{
  save: [];
  back: [];
  'discard-changes': [];
  'field-change': [key: string, value: any];
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

// Helper function to get selected option for combobox
const getSelectedOption = (field: Field, value: any) => {
  if (!field.options || !value) return null;
  const stringValue = value?.toString() || '';
  return (
    field.options.find(
      (option: { value: string; label: string }) => option.value === stringValue
    ) || null
  );
};

// Helper function to handle combobox selection
const handleComboboxChange = (
  field: Field,
  selectedOption: { value: string; label: string } | null
) => {
  const value = selectedOption ? selectedOption.value : '';
  updateField(field.key, value);
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

    <!-- Back Button and Save Button -->
    <div class="flex items-center justify-between gap-2 mx-4">
      <div class="flex items-center gap-2">
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

      <!-- Custom header actions slot -->
      <div class="flex items-center gap-2">
        <slot name="header-actions" :data="data" :readonly="readonly"></slot>
      </div>
    </div>

    <!-- Form Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 m-4">
      <!-- Main Content (2/3 width) -->
      <div class="lg:col-span-2">
        <slot name="main-content" :data="data" :readonly="readonly">
          <!-- Default form fields -->
          <div class="bg-background rounded-lg border p-4">
            <h3 class="text-sm font-semibold flex items-center text-foreground/80 mb-2 gap-2">
              <FileText class="h-4 w-4" />
              Grundläggande information
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 gap-x-4">
              <div v-for="field in mainFields" :key="field.key" class="space-y-1">
                <Label class="text-[10px] font-medium text-foreground/80">{{ field.label }}</Label>
                <Input
                  v-if="field.type === 'text'"
                  :model-value="(data[field.key] ?? '').toString()"
                  :readonly="readonly"
                  class="h-8 md:text-xs"
                  @update:model-value="updateField(field.key, $event)"
                />
                <Input
                  v-else-if="field.type === 'number'"
                  :model-value="Number(data[field.key] ?? 0)"
                  :readonly="readonly"
                  type="number"
                  class="h-8 text-xs"
                  @update:model-value="updateField(field.key, $event)"
                />
                <Input
                  v-else-if="field.type === 'date'"
                  :model-value="(data[field.key] ?? '').toString()"
                  :readonly="readonly"
                  type="date"
                  class="h-8 text-xs"
                  @update:model-value="updateField(field.key, $event)"
                />
                <Textarea
                  v-else-if="field.type === 'textarea'"
                  :model-value="(data[field.key] ?? '').toString()"
                  :readonly="readonly"
                  rows="3"
                  class="md:text-xs resize-none"
                  @update:model-value="updateField(field.key, $event)"
                />
                <Combobox
                  v-else-if="field.type === 'select'"
                  :model-value="getSelectedOption(field, data[field.key])"
                  :disabled="readonly"
                  by="value"
                  @update:model-value="handleComboboxChange(field, $event)"
                >
                  <ComboboxAnchor as-child>
                    <ComboboxTrigger as-child>
                      <Button variant="outline" class="font-normal text-xs">
                        {{
                          getSelectedOption(field, data[field.key])?.label ?? 'Välj alternativ...'
                        }}
                        <ChevronsUpDown class="" />
                      </Button>
                    </ComboboxTrigger>
                  </ComboboxAnchor>

                  <ComboboxList class="">
                    <div class="">
                      <ComboboxInput :placeholder="`Sök ${field.label.toLowerCase()}...`" />
                    </div>

                    <ComboboxEmpty class="text-xs">Inga alternativ hittades.</ComboboxEmpty>

                    <ComboboxGroup>
                      <ComboboxItem
                        v-for="option in field.options"
                        :key="option.value"
                        :value="option"
                        class="text-xs"
                      >
                        {{ option.label }}
                        <ComboboxItemIndicator>
                          <Check class="" />
                        </ComboboxItemIndicator>
                      </ComboboxItem>
                    </ComboboxGroup>
                  </ComboboxList>
                </Combobox>
              </div>
            </div>
          </div>
        </slot>
      </div>

      <!-- Sidebar Content (1/3 width) -->
      <div class="space-y-4">
        <slot name="sidebar-content" :data="data" :readonly="readonly">
          <!-- Default sidebar -->
          <div class="bg-background rounded-lg border p-4">
            <h3
              class="text-sm font-semibold mb-3 flex items-center gap-2 text-secondary-foreground"
            >
              <Info class="h-4 w-4" />
              Information
            </h3>

            <div class="space-y-2">
              <div v-for="field in sidebarFields" :key="field.key" class="space-y-1">
                <Label class="text-[10px] font-medium text-secondary-foreground">
                  {{ field.label }}
                </Label>
                <div class="text-xs text-secondary-foreground">
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
