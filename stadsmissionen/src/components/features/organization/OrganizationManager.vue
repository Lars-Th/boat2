<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold flex items-center gap-2">
        <Building class="h-5 w-5" />
        Stadsmissioner
      </h2>
      <NewOrganizationForm v-model="showNewOrgDialog" @submit="handleCreateOrganization" />
    </div>

    <!-- Organization Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <OrganizationCard
        v-for="org in organizations"
        :key="org.id"
        :organization="org"
        :is-selected="org.id === selectedOrgId"
        @select="handleSelectOrganization"
        @delete="handleDeleteOrganization"
      />
    </div>

    <div v-if="organizations.length === 0" class="text-center py-12">
      <Building class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 class="text-lg font-medium text-muted-foreground mb-2">Inga organisationer</h3>
      <p class="text-muted-foreground mb-4">Skapa din första stadsmission för att komma igång</p>
      <NewOrganizationForm v-model="showNewOrgDialog" @submit="handleCreateOrganization" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Building } from 'lucide-vue-next';
import OrganizationCard from '@/components/features/organization/OrganizationCard.vue';
import NewOrganizationForm from '@/components/features/organization/NewOrganizationForm.vue';

interface Organization {
  id: string;
  namn: string;
  logotyp: string;
  aktiv: boolean;
  enheter: string[];
  kommentarLabels: {
    kommentar1: string;
    kommentar2: string;
    kommentar3: string;
  };
  kontaktuppgifter: {
    adress: string;
    postnummer: string;
    ort: string;
    telefon: string;
    epost: string;
    webbplats: string;
  };
  skapadDatum: string;
  uppdateradDatum: string;
}

interface OrganizationFormData {
  namn: string;
  logotyp: string;
  enheter: string[];
  kommentarLabels: {
    kommentar1: string;
    kommentar2: string;
    kommentar3: string;
  };
  kontaktuppgifter: {
    adress: string;
    postnummer: string;
    ort: string;
    telefon: string;
    epost: string;
    webbplats: string;
  };
}

interface User {
  id: string;
  namn: string;
  epost: string;
  losenord: string;
  roller: string[];
  enheter: string[];
  organisationId: string;
  aktiv: boolean;
  skapadDatum: string;
  uppdateradDatum?: string;
  senastInloggad?: string;
}

interface Props {
  organizations: Organization[];
  selectedOrgId: string;
  users: User[];
}

interface Emits {
  'update:organizations': [organizations: Organization[]];
  'update:selectedOrgId': [orgId: string];
  'update:users': [users: User[]];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showNewOrgDialog = ref(false);

const handleSelectOrganization = (orgId: string) => {
  emit('update:selectedOrgId', orgId);
  console.log('Selected organization:', orgId);
};

const handleCreateOrganization = (formData: OrganizationFormData) => {
  const newOrg: Organization = {
    id: `org-${Date.now()}`,
    namn: formData.namn,
    logotyp: formData.logotyp || '/src/assets/images/default-logo.png',
    aktiv: true,
    enheter: [...formData.enheter],
    kommentarLabels: { ...formData.kommentarLabels },
    kontaktuppgifter: { ...formData.kontaktuppgifter },
    skapadDatum: new Date().toISOString(),
    uppdateradDatum: new Date().toISOString(),
  };

  const updatedOrganizations = [...props.organizations, newOrg];
  emit('update:organizations', updatedOrganizations);
  emit('update:selectedOrgId', newOrg.id);

  console.log('Created new organization:', newOrg);
};

const handleDeleteOrganization = (orgId: string, event: Event) => {
  event.stopPropagation();

  const org = props.organizations.find(o => o.id === orgId);
  if (!org) return;

  // Prevent deleting the last organization
  if (props.organizations.length === 1) {
    alert(
      'Du kan inte ta bort den sista organisationen. Det måste finnas minst en organisation i systemet.'
    );
    return;
  }

  // Check if there are users in this organization
  const orgUsers = props.users.filter(user => user.organisationId === orgId);

  let confirmMessage = `Är du säker på att du vill ta bort "${org.namn}"?`;
  if (orgUsers.length > 0) {
    confirmMessage += `\n\nVarning: Det finns ${orgUsers.length} användare kopplade till denna organisation. De kommer också att tas bort.`;
  }

  if (confirm(confirmMessage)) {
    // Remove organization
    const updatedOrganizations = props.organizations.filter(o => o.id !== orgId);
    emit('update:organizations', updatedOrganizations);

    // Remove users from this organization
    const updatedUsers = props.users.filter(user => user.organisationId !== orgId);
    emit('update:users', updatedUsers);

    // If this was the selected organization, select another one or none
    if (props.selectedOrgId === orgId) {
      const newSelectedId =
        updatedOrganizations.length > 0 ? (updatedOrganizations[0]?.id ?? '') : '';
      emit('update:selectedOrgId', newSelectedId);
    }

    console.log('Deleted organization:', orgId);
  }
};
</script>
