<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import ListPage from '@/components/shared/ListPage.vue';

// Data
import boatsData from '@/assets/data/boats.json';
import customersData from '@/assets/data/customers.json';

// State for ListPage
const router = useRouter();
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(20);
const loading = ref(false);
const hasError = ref(false);

// Season/period filters
const seasonFilter = ref<'alla' | 'var' | 'host'>('alla');
const periodFilter = ref<'alla' | 'denna_vecka' | 'nasta_vecka' | 'denna_manad' | 'nasta_manad'>('alla');

// Helpers for week/month comparison
const isSameWeek = (d: Date, ref: Date) => {
  const getWeek = (date: Date) => {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil((((tmp as any) - (yearStart as any)) / 86400000 + 1) / 7);
  };
  return d.getUTCFullYear() === ref.getUTCFullYear() && getWeek(d) === getWeek(ref);
};

const isSameMonth = (d: Date, ref: Date) => d.getUTCFullYear() === ref.getUTCFullYear() && d.getUTCMonth() === ref.getUTCMonth();

// Enriched planning dataset from boats.json
type PlanningRow = {
  id: number;
  name: string;
  registreringsnummer: string;
  customer_display_name: string;
  spring_date: string | null; // move_from_storage_date (Vår)
  autumn_date: string | null; // move_to_storage_date (Höst)
  spring_date_formatted: string;
  autumn_date_formatted: string;
};

const enrichedRows = computed<PlanningRow[]>(() => {
  return boatsData.map(b => {
    const owner = customersData.find(c => c.id === b.customer_id)?.display_name || 'Okänd kund';
    const springIso = (b as any).move_from_storage_date ?? null; // Vår
    const autumnIso = (b as any).move_to_storage_date ?? null;   // Höst
    return {
      id: b.id,
      name: b.name,
      registreringsnummer: (b as any).registreringsnummer || '-',
      customer_display_name: owner,
      spring_date: springIso,
      autumn_date: autumnIso,
      spring_date_formatted: springIso ? new Date(String(springIso)).toLocaleDateString('sv-SE') : '-',
      autumn_date_formatted: autumnIso ? new Date(String(autumnIso)).toLocaleDateString('sv-SE') : '-',
    };
  });
});

// Filter by season and period
const rowsAfterSeason = computed(() => {
  if (seasonFilter.value === 'alla') return enrichedRows.value;
  if (seasonFilter.value === 'var') return enrichedRows.value.filter(r => !!r.spring_date);
  if (seasonFilter.value === 'host') return enrichedRows.value.filter(r => !!r.autumn_date);
  return enrichedRows.value;
});

const rowsAfterPeriod = computed(() => {
  const now = new Date();
  const nextWeekRef = new Date(now);
  nextWeekRef.setDate(now.getDate() + 7);
  const nextMonthRef = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const matchesPeriod = (iso: string | null) => {
    if (!iso || periodFilter.value === 'alla') return true;
    const d = new Date(iso);
    switch (periodFilter.value) {
      case 'denna_vecka':
        return isSameWeek(d, now);
      case 'nasta_vecka':
        return isSameWeek(d, nextWeekRef);
      case 'denna_manad':
        return isSameMonth(d, now);
      case 'nasta_manad':
        return isSameMonth(d, nextMonthRef);
      default:
        return true;
    }
  };

  // Apply to the relevant date per selected season; if season=alla, pass if either matches
  return rowsAfterSeason.value.filter(r => {
    if (seasonFilter.value === 'var') return matchesPeriod(r.spring_date);
    if (seasonFilter.value === 'host') return matchesPeriod(r.autumn_date);
    return matchesPeriod(r.spring_date) || matchesPeriod(r.autumn_date);
  });
});

// Search (like BoatList.vue style)
const filteredData = computed(() => {
  if (!searchQuery.value) return rowsAfterPeriod.value;
  const q = searchQuery.value.toLowerCase();
  return rowsAfterPeriod.value.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.registreringsnummer.toLowerCase().includes(q) ||
    r.customer_display_name.toLowerCase().includes(q)
  );
});

// Pagination
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredData.value.slice(start, end);
});

// Columns mirroring BoatList style
const columns = [
  { key: 'name', label: 'Båtnamn', sortable: true },
  { key: 'registreringsnummer', label: 'Regnr', sortable: true },
  { key: 'customer_display_name', label: 'Ägare', sortable: true },
  { key: 'spring_date_formatted', label: 'Flyttas/lämnas/hämtas Vår', sortable: true },
  { key: 'autumn_date_formatted', label: 'Flyttas/lämnas/hämtas Höst', sortable: true },
];

// Filters for ListPage ViewControls (stable identity + explicit setters)
const filters = ref([
  {
    modelValue: seasonFilter.value,
    placeholder: 'Säsong',
    options: [
      { key: 'alla', label: 'Alla', value: 'alla' },
      { key: 'var', label: 'Vår', value: 'var' },
      { key: 'host', label: 'Höst', value: 'host' },
    ],
    onChange: (val: string) => {
      seasonFilter.value = (val as any) || 'alla';
      currentPage.value = 1;
    },
  },
  {
    modelValue: periodFilter.value,
    placeholder: 'Period',
    options: [
      { key: 'alla', label: 'Alla perioder', value: 'alla' },
      { key: 'denna_vecka', label: 'Denna vecka', value: 'denna_vecka' },
      { key: 'nasta_vecka', label: 'Nästa vecka', value: 'nasta_vecka' },
      { key: 'denna_manad', label: 'Denna månad', value: 'denna_manad' },
      { key: 'nasta_manad', label: 'Nästa månad', value: 'nasta_manad' },
    ],
    onChange: (val: string) => {
      periodFilter.value = (val as any) || 'alla';
      currentPage.value = 1;
    },
  },
]);

// Keep filter.modelValue in sync with refs without recreating filter objects
watch(seasonFilter, (v) => {
  const arr = filters.value ?? [];
  if (arr[0]) arr[0].modelValue = v;
});
watch(periodFilter, (v) => {
  const arr = filters.value ?? [];
  if (arr[1]) arr[1].modelValue = v;
});

// Handlers to avoid replacing refs in template expressions
const onUpdateSearchQuery = (val: string) => {
  searchQuery.value = val;
};
const onUpdateCurrentPage = (val: number) => {
  currentPage.value = val;
};
const onUpdateItemsPerPage = (val: number) => {
  itemsPerPage.value = val;
};

// Breadcrumbs like BoatList
const breadcrumbs = [
  { label: 'Start', path: '/home' },
  { label: 'Kundinformation', path: '/customers' },
  { label: 'Planeringslista' },
];

const handleRowClick = (row: any) => {
  router.push(`/boats/${row.id}`);
};
</script>

<template>
  <ListPage
    title="Planeringslista"
    description="Planerade flyttar och hämtningar (vår/höst)"
    :breadcrumbs="breadcrumbs"
    :search-query="searchQuery"
    search-placeholder="Sök båtar..."
    :filters="filters"
    :add-actions="[]"
    :data="paginatedData"
    :columns="columns"
    :search-fields="['name','registreringsnummer','customer_display_name']"
    :loading="loading"
    :total-items="filteredData.length"
    :current-page="currentPage"
    :items-per-page="itemsPerPage"
    :has-error="hasError"
    @update:searchQuery="onUpdateSearchQuery"
    @update:currentPage="onUpdateCurrentPage"
    @update:itemsPerPage="onUpdateItemsPerPage"
    @row-click="handleRowClick"
  />
</template>
