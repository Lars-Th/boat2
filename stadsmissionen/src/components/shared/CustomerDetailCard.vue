<script setup lang="ts">
import { computed } from 'vue';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, MapPin, Phone, User } from 'lucide-vue-next';

interface CustomerData {
  customerNumber: string;
  externalCustomerID?: string;
  customerType: 'Företag' | 'Privat';
  companyName?: string;
  organizationNumber?: string;
  firstName?: string;
  lastName?: string;
  personalNumber?: string;
  phone: string;
  email: string;
  contactFirstName?: string;
  contactLastName?: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  status: 'active' | 'inactive';
  notes?: string;
}

interface Props {
  customer: CustomerData;
  readonly?: boolean;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  compact: false,
});

const emit = defineEmits<{
  'update:customer': [customer: CustomerData];
}>();

const localCustomer = computed({
  get: () => {
    console.log('CustomerDetailCard - props.customer:', props.customer);
    return props.customer;
  },
  set: value => emit('update:customer', value),
});

const displayName = computed(() => {
  if (props.customer.customerType === 'Företag') {
    return props.customer.companyName || '';
  }
  return `${props.customer.firstName || ''} ${props.customer.lastName || ''}`.trim();
});

const handleNameInput = (event: Event) => {
  if (props.readonly) return;

  const target = event.target as HTMLInputElement;
  const fullName = target.value.trim();
  const nameParts = fullName.split(' ');

  const updatedCustomer = { ...props.customer };
  if (nameParts.length >= 2) {
    updatedCustomer.firstName = nameParts[0];
    updatedCustomer.lastName = nameParts.slice(1).join(' ');
  } else {
    updatedCustomer.firstName = fullName;
    updatedCustomer.lastName = '';
  }

  emit('update:customer', updatedCustomer);
};

const updateField = (field: keyof CustomerData, value: any) => {
  if (props.readonly) return;

  const updatedCustomer = { ...props.customer };
  (updatedCustomer as any)[field] = value;
  emit('update:customer', updatedCustomer);
};
</script>

<template>
  <div class="space-y-4">
    <!-- Grundläggande information och Kontaktinformation bredvid varandra -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Grundläggande information (2/3 av bredden) -->
      <div class="lg:col-span-2 bg-white rounded-lg border p-4">
        <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600">
          <User class="h-4 w-4" />
          Grundläggande information
        </h3>

        <!-- Första raden: Kundtyp och Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <div>
            <Label class="text-[10px] font-medium text-gray-500 mb-1 block">Kundtyp</Label>
            <Select
              v-if="!readonly"
              :model-value="localCustomer.customerType"
              @update:model-value="updateField('customerType', $event)"
            >
              <SelectTrigger size="sm" class="text-xs border-input bg-background">
                <SelectValue placeholder="Välj kundtyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Företag">Företag</SelectItem>
                <SelectItem value="Privat">Privat</SelectItem>
              </SelectContent>
            </Select>
            <input
              v-else
              :value="localCustomer.customerType"
              class="h-8 w-full text-xs border border-input rounded-md px-2"
              style="color: black !important; background-color: #f8f9fa !important"
              readonly
            />
          </div>

          <div>
            <Label class="text-[10px] font-medium text-gray-500 mb-1 block">Status</Label>
            <Select
              v-if="!readonly"
              :model-value="localCustomer.status"
              @update:model-value="updateField('status', $event)"
            >
              <SelectTrigger size="sm" class="text-xs border-input bg-background">
                <SelectValue placeholder="Välj status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
            <input
              v-else
              :value="localCustomer.status === 'active' ? 'Aktiv' : 'Inaktiv'"
              class="h-8 w-full text-xs border border-input rounded-md px-2"
              style="color: black !important; background-color: #f8f9fa !important"
              readonly
            />
          </div>
        </div>

        <!-- Andra raden: Kundnummer och Externt ID -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <div>
            <Label class="text-[10px] font-medium text-gray-500 mb-1 block">Kundnummer</Label>
            <input
              :value="localCustomer.customerNumber"
              class="h-8 w-full text-xs border border-input rounded-md px-2"
              style="color: black !important; background-color: #f8f9fa !important"
              readonly
            />
          </div>

          <div>
            <Label class="text-[10px] font-medium text-gray-500 mb-1 block">Externt ID</Label>
            <input
              :value="localCustomer.externalCustomerID"
              :readonly="readonly"
              class="h-8 w-full text-xs border border-input rounded-md px-2"
              :style="
                readonly
                  ? 'color: black !important; background-color: #f8f9fa !important;'
                  : 'color: black !important; background-color: white !important;'
              "
              @input="updateField('externalCustomerID', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <!-- Tredje raden: Namn/Företagsnamn och Org/Personnummer -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <Label class="text-[10px] font-medium text-gray-500 mb-1 block">
              {{ localCustomer.customerType === 'Företag' ? 'Företagsnamn' : 'Namn' }}
            </Label>
            <input
              v-if="localCustomer.customerType === 'Företag'"
              :value="localCustomer.companyName || ''"
              :readonly="readonly"
              class="h-8 w-full text-xs border border-input rounded-md px-2"
              :style="
                readonly
                  ? 'color: black !important; background-color: #f8f9fa !important;'
                  : 'color: black !important; background-color: white !important;'
              "
              @input="updateField('companyName', ($event.target as HTMLInputElement).value)"
            />
            <input
              v-else
              :value="displayName"
              :readonly="readonly"
              placeholder="Förnamn Efternamn"
              class="h-8 w-full text-xs border border-input rounded-md px-2"
              :style="
                readonly
                  ? 'color: black !important; background-color: #f8f9fa !important;'
                  : 'color: black !important; background-color: white !important;'
              "
              @input="handleNameInput"
            />
          </div>

          <div>
            <Label class="text-[10px] font-medium text-gray-500 mb-1 block">
              {{
                localCustomer.customerType === 'Företag' ? 'Organisationsnummer' : 'Personnummer'
              }}
            </Label>
            <input
              v-if="localCustomer.customerType === 'Företag'"
              :value="localCustomer.organizationNumber || ''"
              :readonly="readonly"
              class="h-8 w-full text-xs border border-input rounded-md px-2"
              :style="
                readonly
                  ? 'color: black !important; background-color: #f8f9fa !important;'
                  : 'color: black !important; background-color: white !important;'
              "
              @input="updateField('organizationNumber', ($event.target as HTMLInputElement).value)"
            />
            <input
              v-else
              :value="localCustomer.personalNumber || ''"
              :readonly="readonly"
              class="h-8 w-full text-xs border border-input rounded-md px-2"
              :style="
                readonly
                  ? 'color: black !important; background-color: #f8f9fa !important;'
                  : 'color: black !important; background-color: white !important;'
              "
              @input="updateField('personalNumber', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>

      <!-- Kontaktinformation (1/3 av bredden) -->
      <div class="bg-white rounded-lg border p-4">
        <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600">
          <Phone class="h-4 w-4" />
          Kontaktinformation
        </h3>

        <!-- Namn på samma rad -->
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div>
            <Label class="text-[10px] font-medium text-gray-500 mb-1 block">Förnamn</Label>
            <input
              :value="localCustomer.contactFirstName || ''"
              :readonly="readonly"
              class="h-8 w-full text-xs border border-input rounded-md px-2"
              :style="
                readonly
                  ? 'color: black !important; background-color: #f8f9fa !important;'
                  : 'color: black !important; background-color: white !important;'
              "
              @input="updateField('contactFirstName', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <div>
            <Label class="text-[10px] font-medium text-gray-500 mb-1 block">Efternamn</Label>
            <input
              :value="localCustomer.contactLastName || ''"
              :readonly="readonly"
              class="h-8 w-full text-xs border border-input rounded-md px-2"
              :style="
                readonly
                  ? 'color: black !important; background-color: #f8f9fa !important;'
                  : 'color: black !important; background-color: white !important;'
              "
              @input="updateField('contactLastName', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <!-- Telefon -->
        <div class="mb-3">
          <Label class="text-[10px] font-medium text-gray-500 mb-1 block">Telefon</Label>
          <input
            :value="localCustomer.phone"
            :readonly="readonly"
            class="h-8 w-full text-xs border border-input rounded-md px-2"
            type="tel"
            :style="
              readonly
                ? 'color: black !important; background-color: #f8f9fa !important;'
                : 'color: black !important; background-color: white !important;'
            "
            @input="updateField('phone', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <!-- E-post -->
        <div>
          <Label class="text-[10px] font-medium text-gray-500 mb-1 block">E-post</Label>
          <input
            :value="localCustomer.email"
            :readonly="readonly"
            class="h-8 w-full text-xs border border-input rounded-md px-2"
            type="email"
            :style="
              readonly
                ? 'color: black !important; background-color: #f8f9fa !important;'
                : 'color: black !important; background-color: white !important;'
            "
            @input="updateField('email', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>

    <!-- Adressinformation och Anteckningar bredvid varandra -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Adressinformation -->
      <div class="bg-white rounded-lg border p-4">
        <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600">
          <MapPin class="h-4 w-4" />
          Adressinformation
        </h3>

        <div class="space-y-3">
          <!-- Gatuadress -->
          <div>
            <Label class="text-[10px] font-medium text-gray-500 mb-1 block">Gatuadress</Label>
            <input
              :value="localCustomer.address"
              :readonly="readonly"
              placeholder="Gatuadress"
              class="h-8 w-full text-xs border border-input rounded-md px-2"
              :style="
                readonly
                  ? 'color: black !important; background-color: #f8f9fa !important;'
                  : 'color: black !important; background-color: white !important;'
              "
              @input="updateField('address', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- Postnummer och Ort -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label class="text-[10px] font-medium text-gray-500 mb-1 block">Postnummer</Label>
              <input
                :value="localCustomer.postalCode"
                :readonly="readonly"
                placeholder="Postnummer"
                class="h-8 w-full text-xs border border-input rounded-md px-2"
                :style="
                  readonly
                    ? 'color: black !important; background-color: #f8f9fa !important;'
                    : 'color: black !important; background-color: white !important;'
                "
                @input="updateField('postalCode', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div>
              <Label class="text-[10px] font-medium text-gray-500 mb-1 block">Ort</Label>
              <input
                :value="localCustomer.city"
                :readonly="readonly"
                placeholder="Ort"
                class="h-8 w-full text-xs border border-input rounded-md px-2"
                :style="
                  readonly
                    ? 'color: black !important; background-color: #f8f9fa !important;'
                    : 'color: black !important; background-color: white !important;'
                "
                @input="updateField('city', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>

          <!-- Land -->
          <div>
            <Label class="text-[10px] font-medium text-gray-500 mb-1 block">Land</Label>
            <Select
              v-if="!readonly"
              :model-value="localCustomer.country"
              @update:model-value="updateField('country', $event)"
            >
              <SelectTrigger size="sm" class="text-xs border-input bg-background">
                <SelectValue placeholder="Välj land" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sverige">Sverige</SelectItem>
                <SelectItem value="Norge">Norge</SelectItem>
                <SelectItem value="Danmark">Danmark</SelectItem>
                <SelectItem value="Finland">Finland</SelectItem>
                <SelectItem value="Tyskland">Tyskland</SelectItem>
                <SelectItem value="Nederländerna">Nederländerna</SelectItem>
              </SelectContent>
            </Select>
            <input
              v-else
              :value="localCustomer.country"
              class="h-8 w-full text-xs border border-input rounded-md px-2"
              style="color: black !important; background-color: #f8f9fa !important"
              readonly
            />
          </div>
        </div>
      </div>

      <!-- Anteckningar -->
      <div v-if="!compact" class="bg-white rounded-lg border p-4">
        <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600">
          <FileText class="h-4 w-4" />
          Anteckningar
        </h3>

        <textarea
          :value="localCustomer.notes || ''"
          :readonly="readonly"
          rows="8"
          placeholder="Lägg till anteckningar om kunden..."
          class="w-full text-xs border border-input rounded-md px-2 py-1 resize-none"
          :style="
            readonly
              ? 'color: black !important; background-color: #f8f9fa !important;'
              : 'color: black !important; background-color: white !important;'
          "
          @input="updateField('notes', ($event.target as HTMLTextAreaElement).value)"
        />
      </div>
    </div>
  </div>
</template>
