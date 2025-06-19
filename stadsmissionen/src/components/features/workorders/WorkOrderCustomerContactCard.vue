<script setup lang="ts">
import { Building } from 'lucide-vue-next';

interface Contact {
  ContactID: number;
  FirstName: string;
  LastName: string;
  Title?: string;
  Phone?: string;
  Mobile?: string;
  IsPrimary?: boolean;
}

interface Customer {
  CompanyName: string;
  OrganizationNumber?: string;
  Address?: string;
  PostalCode?: string;
  City?: string;
}

interface Props {
  customerInfo?: Customer;
  contactInfo?: Contact;
  customerContacts?: Contact[];
  mainContact?: Contact;
  otherContacts?: Contact[];
}

const props = defineProps<Props>();
</script>

<template>
  <div class="bg-card rounded-lg border border-border p-6">
    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <Building class="h-5 w-5" />
      Kund & Kontakt
    </h3>
    <div class="space-y-4">
      <div>
        <span class="text-muted-foreground block">Kund:</span>
        <span class="font-medium">{{ customerInfo?.CompanyName || 'Okänd kund' }}</span>
      </div>
      <div v-if="customerInfo?.OrganizationNumber">
        <span class="text-muted-foreground block">Org.nummer:</span>
        <span class="font-mono text-sm">{{ customerInfo.OrganizationNumber }}</span>
      </div>

      <!-- Customer Contacts Section -->
      <div v-if="customerContacts && customerContacts.length > 0">
        <span class="text-muted-foreground block mb-2">Kontaktpersoner:</span>
        <div class="space-y-2">
          <!-- Main Contact (Bold) -->
          <div v-if="mainContact" class="border border-border rounded-lg p-3 bg-muted/30">
            <div class="flex items-center justify-between">
              <div>
                <span class="font-bold text-primary">
                  {{ mainContact.FirstName }} {{ mainContact.LastName }}
                </span>
                <span class="text-xs text-muted-foreground ml-2">(Huvudkontakt)</span>
                <div v-if="mainContact.Title" class="text-sm text-muted-foreground">
                  {{ mainContact.Title }}
                </div>
              </div>
              <div class="text-right">
                <div v-if="mainContact.Phone" class="text-sm">
                  <a
                    :href="`tel:${mainContact.Phone}`"
                    class="text-primary hover:underline font-medium"
                  >
                    {{ mainContact.Phone }}
                  </a>
                </div>
                <div
                  v-if="mainContact.Mobile && mainContact.Mobile !== mainContact.Phone"
                  class="text-sm"
                >
                  <a :href="`tel:${mainContact.Mobile}`" class="text-primary hover:underline">
                    {{ mainContact.Mobile }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Other Contacts -->
          <div
            v-for="contact in otherContacts"
            :key="contact.ContactID"
            class="border border-border rounded-lg p-3"
          >
            <div class="flex items-center justify-between">
              <div>
                <span class="font-medium">{{ contact.FirstName }} {{ contact.LastName }}</span>
                <div v-if="contact.Title" class="text-sm text-muted-foreground">
                  {{ contact.Title }}
                </div>
              </div>
              <div class="text-right">
                <div v-if="contact.Phone" class="text-sm">
                  <a :href="`tel:${contact.Phone}`" class="text-primary hover:underline">
                    {{ contact.Phone }}
                  </a>
                </div>
                <div v-if="contact.Mobile && contact.Mobile !== contact.Phone" class="text-sm">
                  <a :href="`tel:${contact.Mobile}`" class="text-primary hover:underline">
                    {{ contact.Mobile }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fallback to original contact info if no customer contacts available -->
      <div v-else-if="contactInfo">
        <span class="text-muted-foreground block">Kontaktperson:</span>
        <div class="border border-border rounded-lg p-3">
          <div class="flex items-center justify-between">
            <div>
              <span class="font-medium">
                {{ contactInfo.FirstName }} {{ contactInfo.LastName }}
              </span>
            </div>
            <div class="text-right">
              <div v-if="contactInfo.Phone" class="text-sm">
                <a :href="`tel:${contactInfo.Phone}`" class="text-primary hover:underline">
                  {{ contactInfo.Phone }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="customerInfo?.Address">
        <span class="text-muted-foreground block">Kundadress:</span>
        <div class="text-sm">
          <div>{{ customerInfo.Address }}</div>
          <div>{{ customerInfo.PostalCode }} {{ customerInfo.City }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
