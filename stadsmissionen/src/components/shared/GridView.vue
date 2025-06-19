<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  data: Record<string, unknown>[];
  loading?: boolean;
  columns?: any[]; // For fallback rendering if no custom slot provided
  cardClass?: string;
  gridCols?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  columns: () => [],
  cardClass: '',
  gridCols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
});

const emit = defineEmits<{
  cardClick: [item: Record<string, unknown>];
  actionClick: [action: string, item: Record<string, unknown>];
}>();

// Helper function to get display value for a field
const getDisplayValue = (item: Record<string, unknown>, key: string) => {
  const value = item[key];
  if (value === null || value === undefined) return '-';

  // Handle nested objects (like customer.CompanyName)
  if (typeof value === 'object' && value !== null) {
    // For customer objects, try to get a display name
    if (key === 'customer') {
      const customer = value as any;
      return (
        customer.CompanyName ||
        customer.name ||
        customer.contactFirstName ||
        customer.contactLastName ||
        '[Kund]'
      );
    }
    return '[Object]';
  }

  // Format dates
  if (key.toLowerCase().includes('date') || key.toLowerCase().includes('login')) {
    try {
      return new Date(value as string).toLocaleDateString('sv-SE');
    } catch {
      return String(value);
    }
  }

  return String(value);
};

// Helper function to get badge variant based on status
const getBadgeVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    // User statuses
    case 'active':
    case 'aktiv':
      return 'default';
    case 'inactive':
    case 'inaktiv':
      return 'secondary';

    // Boat statuses
    case 'placed':
    case 'placerad':
      return 'default';
    case 'unplaced':
    case 'oplacerad':
      return 'destructive';
    case 'in-water':
    case 'i sjön':
      return 'secondary';

    default:
      return 'outline';
  }
};

// Handle card clicks
const handleCardClick = (item: Record<string, unknown>) => {
  emit('cardClick', item);
};
</script>

<template>
  <div class="pb-6">
    <!-- Loading state -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p class="mt-2 text-sm text-muted-foreground">Laddar...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="data.length === 0" class="text-center py-8">
      <p class="text-sm text-muted-foreground">Inga resultat hittades</p>
    </div>

    <!-- Grid of cards -->
    <div v-else :class="['grid gap-4 pl-4 pr-4', gridCols]">
      <Card
        v-for="(item, index) in data"
        :key="item.id || index"
        :class="[
          'cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
          cardClass,
        ]"
        @click="handleCardClick(item)"
      >
        <!-- Custom card content via slot -->
        <slot name="card" :item="item" :index="index">
          <!-- Default card layout if no custom slot provided -->
          <CardHeader class="pb-3">
            <CardTitle class="text-base">
              {{
                getDisplayValue(item, 'name') ||
                getDisplayValue(item, 'boatType') ||
                getDisplayValue(item, 'companyName') ||
                getDisplayValue(item, 'title') ||
                `Item ${index + 1}`
              }}
            </CardTitle>
            <div v-if="item.status" class="flex items-center gap-2">
              <Badge :variant="getBadgeVariant(item.status as string)" class="text-xs">
                {{ getDisplayValue(item, 'status') }}
              </Badge>
            </div>
          </CardHeader>

          <CardContent class="space-y-2">
            <!-- Show customer for boats -->
            <div v-if="item.customer" class="text-sm text-muted-foreground">
              <strong>Kund:</strong>
              {{ getDisplayValue(item, 'customer') }}
            </div>

            <!-- Show key fields for different data types -->
            <div v-if="item.email" class="text-sm text-muted-foreground">
              {{ getDisplayValue(item, 'email') }}
            </div>
            <div v-if="item.phone" class="text-sm text-muted-foreground">
              {{ getDisplayValue(item, 'phone') }}
            </div>
            <div v-if="item.department" class="text-sm text-muted-foreground">
              <strong>Avdelning:</strong>
              {{ getDisplayValue(item, 'department') }}
            </div>

            <!-- Show boat-specific fields -->
            <div v-if="item.length && item.width" class="text-sm text-muted-foreground">
              <strong>Mått:</strong>
              {{ item.length }}m × {{ item.width }}m
            </div>
            <div v-if="item.location" class="text-sm text-muted-foreground">
              <strong>Plats:</strong>
              {{ getDisplayValue(item, 'location') }}
            </div>

            <!-- Show comments/description if available -->
            <div v-if="item.comments" class="text-xs text-muted-foreground line-clamp-2">
              {{ getDisplayValue(item, 'comments') }}
            </div>

            <!-- Show lastLogin for users -->
            <div v-if="item.lastLogin" class="text-xs text-muted-foreground">
              <strong>Senast inloggad:</strong>
              {{ getDisplayValue(item, 'lastLogin') }}
            </div>

            <!-- Show additional fields from columns if available -->
            <template v-if="columns.length > 0">
              <div
                v-for="column in columns.slice(0, 2)"
                :key="column.key"
                class="text-sm text-muted-foreground"
              >
                <template
                  v-if="
                    column.key !== 'name' &&
                    column.key !== 'boatType' &&
                    column.key !== 'customer' &&
                    column.key !== 'email' &&
                    column.key !== 'phone' &&
                    column.key !== 'status' &&
                    column.key !== 'actions' &&
                    column.key !== 'length' &&
                    column.key !== 'width' &&
                    column.key !== 'location' &&
                    column.key !== 'comments' &&
                    item[column.key]
                  "
                >
                  <strong>{{ column.label }}:</strong>
                  {{ getDisplayValue(item, column.key) }}
                </template>
              </div>
            </template>
          </CardContent>
        </slot>

        <!-- Actions slot for custom actions -->
        <div v-if="$slots.actions" class="px-6 pb-6">
          <slot name="actions" :item="item" :index="index"></slot>
        </div>
      </Card>
    </div>
  </div>
</template>
