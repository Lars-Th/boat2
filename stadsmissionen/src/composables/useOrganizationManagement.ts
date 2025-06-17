import { computed, ref } from 'vue';

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

interface Stat {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

export function useOrganizationManagement(
  initialOrganizations: Organization[] = [],
  initialUsers: User[] = []
) {
  const organizations = ref<Organization[]>(initialOrganizations);
  const users = ref<User[]>(initialUsers);
  const selectedOrgId = ref<string>(initialOrganizations[0]?.id ?? '');

  // Computed properties
  const selectedOrganization = computed(() => {
    return organizations.value.find((org: Organization) => org.id === selectedOrgId.value);
  });

  const organizationUsers = computed(() => {
    return users.value.filter((user: User) => user.organisationId === selectedOrgId.value);
  });

  const stats = computed<Stat[]>(() => [
    {
      title: 'Totalt organisationer',
      value: organizations.value.length,
      color: 'blue',
    },
    {
      title: 'Aktiva användare',
      value: organizationUsers.value.filter((u: User) => u.aktiv).length,
      color: 'green',
    },
    {
      title: 'Enheter',
      value: selectedOrganization.value?.enheter.length ?? 0,
      color: 'purple',
    },
    {
      title: 'Roller',
      value: new Set(organizationUsers.value.flatMap((u: User) => u.roller)).size,
      color: 'orange',
    },
  ]);

  // Actions
  const selectOrganization = (orgId: string): void => {
    selectedOrgId.value = orgId;
    console.log('Selected organization:', orgId);
  };

  const createOrganization = (formData: OrganizationFormData) => {
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

    organizations.value.push(newOrg);
    selectedOrgId.value = newOrg.id;
    console.log('Created new organization:', newOrg);

    return newOrg;
  };

  const deleteOrganization = (orgId: string): boolean => {
    const org = organizations.value.find((o: Organization) => o.id === orgId);
    if (!org) return false;

    // Prevent deleting the last organization
    if (organizations.value.length === 1) {
      alert(
        'Du kan inte ta bort den sista organisationen. Det måste finnas minst en organisation i systemet.'
      );
      return false;
    }

    // Check if there are users in this organization
    const orgUsers = users.value.filter((user: User) => user.organisationId === orgId);

    let confirmMessage = `Är du säker på att du vill ta bort "${org.namn}"?`;
    if (orgUsers.length > 0) {
      confirmMessage += `\n\nVarning: Det finns ${orgUsers.length} användare kopplade till denna organisation. De kommer också att tas bort.`;
    }

    if (confirm(confirmMessage)) {
      // Remove organization
      const orgIndex = organizations.value.findIndex((o: Organization) => o.id === orgId);
      if (orgIndex > -1) {
        organizations.value.splice(orgIndex, 1);
      }

      // Remove users from this organization
      users.value = users.value.filter((user: User) => user.organisationId !== orgId);

      // If this was the selected organization, select another one or none
      if (selectedOrgId.value === orgId) {
        selectedOrgId.value =
          organizations.value.length > 0 ? (organizations.value[0]?.id ?? '') : '';
      }

      console.log('Deleted organization:', orgId);
      return true;
    }

    return false;
  };

  const addUnit = (unitName: string): void => {
    if (selectedOrganization.value && unitName.trim()) {
      if (!selectedOrganization.value.enheter.includes(unitName.trim())) {
        selectedOrganization.value.enheter.push(unitName.trim());
        selectedOrganization.value.uppdateradDatum = new Date().toISOString();
        console.log('Added unit:', unitName);
      }
    }
  };

  const removeUnit = (unitName: string): void => {
    if (selectedOrganization.value) {
      const index = selectedOrganization.value.enheter.indexOf(unitName);
      if (index > -1) {
        selectedOrganization.value.enheter.splice(index, 1);
        selectedOrganization.value.uppdateradDatum = new Date().toISOString();
        console.log('Removed unit:', unitName);
      }
    }
  };

  const updateOrganizationInfo = (updates: Partial<Organization>): void => {
    if (selectedOrganization.value) {
      Object.assign(selectedOrganization.value, updates);
      selectedOrganization.value.uppdateradDatum = new Date().toISOString();
      console.log('Updated organization info');
    }
  };

  return {
    // State
    organizations,
    users,
    selectedOrgId,

    // Computed
    selectedOrganization,
    organizationUsers,
    stats,

    // Actions
    selectOrganization,
    createOrganization,
    deleteOrganization,
    addUnit,
    removeUnit,
    updateOrganizationInfo,
  };
}
