<template>
  <div class="max-w-2xl">
    <h3 class="font-semibold text-sm text-gray-900 mb-6">Faktureringsadress</h3>
    
    <div class="space-y-4">
      <div>
        <Label for="billingStreetAddress" class="text-xs font-medium text-gray-700">Gatuadress</Label>
        <Input
          id="billingStreetAddress"
          v-model="editedCustomer.billingStreetAddress"
          @input="$emit('field-change')"
          placeholder="Gatunamn 123 eller Box 456"
          class="text-xs h-8 mt-1"
          style="font-size: 12px;"
        />
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label for="billingPostalCode" class="text-xs font-medium text-gray-700">Postnummer</Label>
          <Input
            id="billingPostalCode"
            v-model="editedCustomer.billingPostalCode"
            @input="$emit('field-change')"
            placeholder="12345"
            class="text-xs h-8 mt-1"
            style="font-size: 12px;"
          />
        </div>
        
        <div>
          <Label for="billingCity" class="text-xs font-medium text-gray-700">Ort</Label>
          <Input
            id="billingCity"
            v-model="editedCustomer.billingCity"
            @input="$emit('field-change')"
            placeholder="Stockholm"
            class="text-xs h-8 mt-1"
            style="font-size: 12px;"
          />
        </div>
      </div>
      
      <div>
        <Label for="billingCountry" class="text-xs font-medium text-gray-700">Land</Label>
        <Input
          id="billingCountry"
          v-model="editedCustomer.billingCountry"
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