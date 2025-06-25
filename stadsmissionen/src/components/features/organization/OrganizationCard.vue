<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Check, Phone, Trash2 } from 'lucide-vue-next';
import type { Organization } from '@/types';

interface Props {
  organization: Organization;
  isSelected: boolean;
}

interface Emits {
  select: [organizationId: string];
  delete: [organizationId: string, event: Event];
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <Card
    class="cursor-pointer transition-all hover:shadow-md group"
    :class="{
      'ring-2 ring-primary bg-primary/5': isSelected,
      'hover:bg-muted/30': !isSelected,
    }"
    @click="emit('select', organization.id)"
  >
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <CardTitle class="text-lg">{{ organization.namn }}</CardTitle>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Building class="h-4 w-4" />
            {{ organization.enheter.length }} enheter
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Badge :variant="organization.aktiv ? 'default' : 'outline'" class="text-xs">
            {{ organization.aktiv ? 'Aktiv' : 'Inaktiv' }}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            class="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
            @click.stop="emit('delete', organization.id, $event)"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      <div class="space-y-3">
        <!-- Contact Info -->
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-sm">
            <Phone class="h-3 w-3 text-muted-foreground" />
            <span>{{ organization.kontaktuppgifter?.telefon ?? 'Ingen telefon' }}</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{{ organization.kontaktuppgifter?.ort ?? 'Ingen ort' }}</span>
          </div>
        </div>

        <!-- Units Preview -->
        <div class="space-y-2">
          <div class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Enheter
          </div>
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="enhet in organization.enheter.slice(0, 3)"
              :key="enhet"
              variant="outline"
              class="text-xs"
            >
              {{ enhet }}
            </Badge>
            <Badge v-if="organization.enheter.length > 3" variant="outline" class="text-xs">
              +{{ organization.enheter.length - 3 }} till
            </Badge>
          </div>
          <p v-if="organization.enheter.length === 0" class="text-xs text-muted-foreground">
            Inga enheter
          </p>
        </div>

        <!-- Selection Indicator -->
        <div v-if="isSelected" class="flex items-center gap-2 text-xs text-primary font-medium">
          <Check class="h-3 w-3" />
          Vald organisation
        </div>
      </div>
    </CardContent>
  </Card>
</template>
