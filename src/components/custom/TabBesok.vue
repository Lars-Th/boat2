<template>
  <div class="max-w-2xl">
    <h3 class="font-semibold text-sm text-gray-900 mb-6">Besöksadress</h3>
    
    <div class="space-y-4">
      <div>
        <Label for="streetAddress" class="text-xs font-medium text-gray-700">Gatuadress</Label>
        <Input
          id="streetAddress"
          v-model="editedCustomer.streetAddress"
          @input="$emit('field-change')"
          placeholder="Gatunamn 123"
          class="text-xs h-8 mt-1"
          style="font-size: 12px;"
        />
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label for="postalCode" class="text-xs font-medium text-gray-700">Postnummer</Label>
          <Input
            id="postalCode"
            v-model="editedCustomer.postalCode"
            @input="$emit('field-change')"
            placeholder="12345"
            class="text-xs h-8 mt-1"
            style="font-size: 12px;"
          />
        </div>
        
        <div>
          <Label for="city" class="text-xs font-medium text-gray-700">Ort</Label>
          <Input
            id="city"
            v-model="editedCustomer.city"
            @input="$emit('field-change')"
            placeholder="Stockholm"
            class="text-xs h-8 mt-1"
            style="font-size: 12px;"
          />
        </div>
      </div>
      
      <div>
        <Label for="country" class="text-xs font-medium text-gray-700">Land</Label>
        <Input
          id="country"
          v-model="editedCustomer.country"
          @input="$emit('field-change')"
          value="Sverige"
          readonly
          class="bg-gray-50 text-xs h-8 mt-1"
          style="font-size: 12px;"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Customer } from '@/storages/customerStorage'

interface Props {
  editedCustomer: Customer
}

defineProps<Props>()

defineEmits<{
  'field-change': []
}>()
</script> 