<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Settings class="h-5 w-5" />
        Enheter för {{ organizationName }}
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Add new unit -->
      <form class="flex gap-2" @submit.prevent="handleAddUnit">
        <Input
          v-model="newUnitName"
          placeholder="Ny enhetsnamn..."
          class="flex-1"
          :disabled="isSubmitting"
        />
        <Button type="submit" :disabled="!newUnitName.trim() || isSubmitting" class="gap-2">
          <Plus class="h-4 w-4" />
          {{ isSubmitting ? 'Lägger till...' : 'Lägg till' }}
        </Button>
      </form>

      <!-- Units list -->
      <div class="space-y-2">
        <TransitionGroup name="list" tag="div" class="space-y-2">
          <div
            v-for="unit in units"
            :key="unit"
            class="flex items-center justify-between p-3 bg-muted rounded-lg transition-all hover:bg-muted/80"
          >
            <span class="font-medium">{{ unit }}</span>
            <Button
              variant="ghost"
              size="sm"
              class="text-red-600 hover:text-red-700 hover:bg-red-50"
              :disabled="isRemoving"
              @click="handleRemoveUnit(unit)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </TransitionGroup>

        <div v-if="units.length === 0" class="text-muted-foreground text-center py-8">
          <Settings class="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Inga enheter har lagts till än</p>
          <p class="text-sm">Lägg till din första enhet ovan</p>
        </div>
      </div>

      <!-- Unit statistics -->
      <div v-if="units.length > 0" class="bg-muted/50 p-4 rounded-lg border-t">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">Totalt enheter:</span>
          <span class="font-medium">{{ units.length }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Settings, Trash2 } from 'lucide-vue-next';

interface Props {
  units: string[];
  organizationName: string;
}

interface Emits {
  'add-unit': [unitName: string];
  'remove-unit': [unitName: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const newUnitName = ref('');
const isSubmitting = ref(false);
const isRemoving = ref(false);

const handleAddUnit = async () => {
  const unitName = newUnitName.value.trim();
  if (!unitName) return;

  // Check for duplicates
  if (props.units.includes(unitName)) {
    alert('En enhet med detta namn finns redan');
    return;
  }

  isSubmitting.value = true;

  try {
    emit('add-unit', unitName);
    newUnitName.value = '';
  } catch (error) {
    console.error('Error adding unit:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleRemoveUnit = async (unitName: string) => {
  const confirmed = confirm(`Är du säker på att du vill ta bort enheten "${unitName}"?`);
  if (!confirmed) return;

  isRemoving.value = true;

  try {
    emit('remove-unit', unitName);
  } catch (error) {
    console.error('Error removing unit:', error);
  } finally {
    isRemoving.value = false;
  }
};
</script>

<style lang="sass" scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
