<template>
  <div class="space-y-8">
    <!-- Grundläggande företagsinformation -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Kolumn 1: Företagsinfo -->
      <div class="space-y-4">
        <h3 class="font-semibold text-sm text-gray-900 mb-4">
          Företagsinformation
        </h3>
        
        <div class="space-y-3">
          <FormField
            label="Kundnummer"
            field-name="customerNumber"
            :error="props.errors?.customerNumber"
            tooltip="Unikt kundnummer för identifiering"
          >
            <Input
              id="customerNumber"
              v-model="editedCustomer.customerNumber"
              placeholder="KU-001"
              class="text-xs h-8"
              style="font-size: 12px;"
              @input="$emit('field-change')"
              @blur="handleFieldBlur('customerNumber')"
            />
          </FormField>
          
          <FormField
            label="Företagsnamn"
            field-name="companyName"
            :required="true"
            :error="props.errors?.companyName"
            tooltip="Företagets officiella namn"
          >
            <Input
              id="companyName"
              v-model="editedCustomer.companyName"
              placeholder="Ange företagsnamn"
              class="text-xs h-8 font-medium"
              style="font-size: 12px;"
              @input="$emit('field-change')"
              @blur="handleFieldBlur('companyName')"
            />
          </FormField>
          
          <FormField
            label="Organisationsnummer"
            field-name="organizationNumber"
            :error="props.errors?.organizationNumber"
            tooltip="Svenskt organisationsnummer (556123-4567)"
          >
            <Input
              id="organizationNumber"
              v-model="editedCustomer.organizationNumber"
              placeholder="556123-4567"
              class="text-xs h-8"
              style="font-size: 12px;"
              @input="$emit('field-change')"
              @blur="handleFieldBlur('organizationNumber')"
            />
          </FormField>
          
          <FormField
            label="Referensnummer"
            field-name="referenceNumber"
            :error="props.errors?.referenceNumber"
            tooltip="Internt referensnummer för spårning"
          >
            <Input
              id="referenceNumber"
              v-model="editedCustomer.referenceNumber"
              placeholder="Internt referensnummer"
              class="text-xs h-8"
              style="font-size: 12px;"
              @input="$emit('field-change')"
              @blur="handleFieldBlur('referenceNumber')"
            />
          </FormField>
        </div>
      </div>

      <!-- Kolumn 2: Kontaktinfo -->
      <div class="space-y-4">
        <h3 class="font-semibold text-sm text-gray-900 mb-4">
          Kontaktinformation
        </h3>
        
        <div class="space-y-3">
          <FormField
            label="Växelnummer"
            field-name="switchboardNumber"
            :error="props.errors?.switchboardNumber"
            tooltip="Företagets huvudtelefonnummer"
          >
            <Input
              id="switchboardNumber"
              v-model="editedCustomer.switchboardNumber"
              placeholder="08-123 45 67"
              class="text-xs h-8"
              style="font-size: 12px;"
              @input="$emit('field-change')"
              @blur="handleFieldBlur('switchboardNumber')"
            />
          </FormField>
          
          <FormField
            label="E-postadress"
            field-name="companyEmail"
            :error="props.errors?.companyEmail"
            tooltip="Företagets huvudsakliga e-postadress"
          >
            <Input
              id="companyEmail"
              v-model="editedCustomer.companyEmail"
              type="email"
              placeholder="info@företag.se"
              class="text-xs h-8"
              style="font-size: 12px;"
              @input="$emit('field-change')"
              @blur="handleFieldBlur('companyEmail')"
            />
          </FormField>
          
          <FormField
            label="Webbplats"
            field-name="website"
            :error="props.errors?.website"
            tooltip="Företagets webbplats (med http:// eller https://)"
          >
            <Input
              id="website"
              v-model="editedCustomer.website"
              placeholder="https://www.företag.se"
              class="text-xs h-8"
              style="font-size: 12px;"
              @input="$emit('field-change')"
              @blur="handleFieldBlur('website')"
            />
          </FormField>
        </div>
      </div>

      <!-- Kolumn 3: Status -->
      <div class="space-y-4">
        <h3 class="font-semibold text-sm text-gray-900 mb-4">
          Status & Klassificering
        </h3>
        
        <div class="space-y-3">
          <div>
            <Label
              for="companyType"
              class="text-xs font-medium text-gray-700"
            >Typ av företag</Label>
            <Select
              v-model="editedCustomer.companyType"
              @update:model-value="$emit('field-change')"
            >
              <SelectTrigger
                class="text-xs h-8 mt-1 flex items-center justify-between"
                style="font-size: 12px;"
              >
                <SelectValue placeholder="Välj typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kund">
                  Kund
                </SelectItem>
                <SelectItem value="Leverantör">
                  Leverantör
                </SelectItem>
                <SelectItem value="ÅF">
                  ÅF (Återförsäljare)
                </SelectItem>
                <SelectItem value="Prospect">
                  Prospect
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label
              for="status"
              class="text-xs font-medium text-gray-700"
            >Status</Label>
            <Select
              v-model="editedCustomer.status"
              @update:model-value="$emit('field-change')"
            >
              <SelectTrigger
                class="text-xs h-8 mt-1 flex items-center justify-between"
                style="font-size: 12px;"
              >
                <SelectValue placeholder="Välj status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aktiv">
                  Aktiv
                </SelectItem>
                <SelectItem value="Inaktiv">
                  Inaktiv
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>

    <!-- Anteckningar -->
    <div class="space-y-4">
      <h3 class="font-semibold text-sm text-gray-900 mb-4">
        Anteckningar om bolaget
      </h3>
      
      <div>
        <Label
          for="companyNotes"
          class="text-xs font-medium text-gray-700"
        >Anteckningar</Label>
        <Textarea
          id="companyNotes"
          v-model="editedCustomer.companyNotes"
          rows="4"
          placeholder="Lägg till anteckningar om företaget, viktiga kontakter, avtal, etc..."
          class="resize-none text-xs mt-1"
          style="font-size: 12px;"
          @input="$emit('field-change')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import FormField from '@/components/ui/FormField.vue'
import type { Customer } from '@/storages/CustomerStorage'

interface Props {
  editedCustomer: Customer
  errors?: Record<string, string | null>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'field-change': []
  'field-blur': [fieldName: string]
}>()

const handleFieldBlur = (fieldName: string) => {
  emit('field-blur', fieldName)
}
</script> 