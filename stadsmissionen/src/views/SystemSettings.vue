<script setup lang="ts">
import { ref } from "vue";
import PageLayout from "@/components/layout/PageLayout.vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  MessageSquare,
  Save,
  Users,
  Edit,
} from "lucide-vue-next";

// Import components
import OrganizationManager from "@/components/features/organization/OrganizationManager.vue";
import UnitManager from "@/components/features/organization/UnitManager.vue";

// Import composables
import { useOrganizationManagement } from "@/composables/useOrganizationManagement";

// Import data
import organizationSettingsData from "@/assets/data/organizationSettings.json";
import usersData from "@/assets/data/users.json";

// Initialize composable
const {
  organizations,
  users,
  selectedOrgId,
  selectedOrganization,
  organizationUsers,
  stats,
  selectOrganization,
  addUnit,
  removeUnit,
  updateOrganizationInfo,
} = useOrganizationManagement(
  organizationSettingsData.organizations,
  usersData
);

// Set initial selected organization
selectedOrgId.value = organizationSettingsData.currentOrganization;

// Local state for editing
const editingOrgInfo = ref(false);
const permissions = ref(organizationSettingsData.permissions);

// Save organization info
const saveOrganizationInfo = () => {
  if (selectedOrganization.value) {
    updateOrganizationInfo({
      uppdateradDatum: new Date().toISOString(),
    });
    editingOrgInfo.value = false;
    console.log("Saved organization info");
  }
};

// Get role display name
const getRoleDisplayName = (roleId: string) => {
  const role = permissions.value.roles.find((r) => r.id === roleId);
  return role?.namn ?? roleId;
};

// Get role color
const getRoleColor = (roleId: string) => {
  switch (roleId) {
    case "systemadministrator":
      return "destructive";
    case "administrator":
      return "default";
    case "enhetsansvarig":
      return "secondary";
    case "handlaggare":
      return "outline";
    default:
      return "outline";
  }
};
</script>

<template>
  <PageLayout
    title="Systeminställningar"
    breadcrumbs="Dashboard / Administration / Inställningar"
    show-stats
    :stats="stats"
  >
    <!-- Main content -->
    <div class="space-y-8 p-6">
      <!-- Organization Manager Section -->
      <OrganizationManager
        :organizations="organizations"
        :selected-org-id="selectedOrgId"
        :users="users"
        @update:organizations="organizations = $event"
        @update:selected-org-id="selectOrganization"
        @update:users="users = $event"
      />

      <!-- Management Tabs for Selected Organization -->
      <div
        v-if="selectedOrganization"
        class="space-y-4"
      >
        <div class="border-t pt-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Edit class="h-5 w-5" />
            Hantera: {{ selectedOrganization.namn }}
          </h2>

          <Tabs
            default-value="info"
            class="w-full"
          >
            <TabsList class="grid w-full grid-cols-3">
              <TabsTrigger value="info"> Grundinfo </TabsTrigger>
              <TabsTrigger value="units"> Enheter </TabsTrigger>
              <TabsTrigger value="users"> Användare </TabsTrigger>
            </TabsList>

            <!-- Organization Info Tab -->
            <TabsContent
              value="info"
              class="space-y-6"
            >
              <Card>
                <CardHeader>
                  <div class="flex items-center justify-between">
                    <CardTitle class="flex items-center gap-2">
                      <Building class="h-5 w-5" />
                      Organisationsinformation
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      class="gap-2"
                      @click="editingOrgInfo = !editingOrgInfo"
                    >
                      <Edit class="h-4 w-4" />
                      {{ editingOrgInfo ? "Avbryt" : "Redigera" }}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Basic Info -->
                    <div class="space-y-4">
                      <div class="space-y-2">
                        <Label>Organisationsnamn</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="selectedOrganization.namn"
                          placeholder="Organisationsnamn"
                        />
                        <p
                          v-else
                          class="text-sm bg-muted p-2 rounded"
                        >
                          {{ selectedOrganization.namn }}
                        </p>
                      </div>

                      <div class="space-y-2">
                        <Label>Logotyp (URL)</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="selectedOrganization.logotyp"
                          placeholder="Sökväg till logotyp"
                        />
                        <div
                          v-else
                          class="flex items-center gap-2"
                        >
                          <img
                            v-if="selectedOrganization.logotyp"
                            :src="selectedOrganization.logotyp"
                            :alt="selectedOrganization.namn"
                            class="h-8 w-8 object-contain"
                          >
                          <p class="text-sm bg-muted p-2 rounded flex-1">
                            {{
                              selectedOrganization.logotyp || "Ingen logotyp"
                            }}
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Contact Info -->
                    <div class="space-y-4">
                      <h4 class="font-medium flex items-center gap-2">
                        <MessageSquare class="h-4 w-4" />
                        Kontaktuppgifter
                      </h4>

                      <div class="space-y-2">
                        <Label>Adress</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="selectedOrganization.kontaktuppgifter.adress"
                          placeholder="Gatuadress"
                        />
                        <p
                          v-else
                          class="text-sm bg-muted p-2 rounded"
                        >
                          {{
                            selectedOrganization.kontaktuppgifter.adress ||
                              "Ingen adress"
                          }}
                        </p>
                      </div>

                      <div class="grid grid-cols-2 gap-2">
                        <div class="space-y-2">
                          <Label>Postnummer</Label>
                          <Input
                            v-if="editingOrgInfo"
                            v-model="
                              selectedOrganization.kontaktuppgifter.postnummer
                            "
                            placeholder="12345"
                          />
                          <p
                            v-else
                            class="text-sm bg-muted p-2 rounded"
                          >
                            {{
                              selectedOrganization.kontaktuppgifter
                                .postnummer || "-"
                            }}
                          </p>
                        </div>
                        <div class="space-y-2">
                          <Label>Ort</Label>
                          <Input
                            v-if="editingOrgInfo"
                            v-model="selectedOrganization.kontaktuppgifter.ort"
                            placeholder="Ort"
                          />
                          <p
                            v-else
                            class="text-sm bg-muted p-2 rounded"
                          >
                            {{
                              selectedOrganization.kontaktuppgifter.ort || "-"
                            }}
                          </p>
                        </div>
                      </div>

                      <div class="space-y-2">
                        <Label>Telefon</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="
                            selectedOrganization.kontaktuppgifter.telefon
                          "
                          placeholder="031-123456"
                        />
                        <p
                          v-else
                          class="text-sm bg-muted p-2 rounded"
                        >
                          {{
                            selectedOrganization.kontaktuppgifter.telefon ||
                              "Ingen telefon"
                          }}
                        </p>
                      </div>

                      <div class="space-y-2">
                        <Label>E-post</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="selectedOrganization.kontaktuppgifter.epost"
                          type="email"
                          placeholder="info@example.se"
                        />
                        <p
                          v-else
                          class="text-sm bg-muted p-2 rounded"
                        >
                          {{
                            selectedOrganization.kontaktuppgifter.epost ||
                              "Ingen e-post"
                          }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Comment Labels -->
                  <div class="space-y-4">
                    <h4 class="font-medium flex items-center gap-2">
                      <MessageSquare class="h-4 w-4" />
                      Kommentarsetiketter
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div class="space-y-2">
                        <Label>Kommentar 1</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="
                            selectedOrganization.kommentarLabels.kommentar1
                          "
                          placeholder="Etikett för kommentar 1"
                        />
                        <p
                          v-else
                          class="text-sm bg-muted p-2 rounded"
                        >
                          {{ selectedOrganization.kommentarLabels.kommentar1 }}
                        </p>
                      </div>
                      <div class="space-y-2">
                        <Label>Kommentar 2</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="
                            selectedOrganization.kommentarLabels.kommentar2
                          "
                          placeholder="Etikett för kommentar 2"
                        />
                        <p
                          v-else
                          class="text-sm bg-muted p-2 rounded"
                        >
                          {{ selectedOrganization.kommentarLabels.kommentar2 }}
                        </p>
                      </div>
                      <div class="space-y-2">
                        <Label>Kommentar 3</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="
                            selectedOrganization.kommentarLabels.kommentar3
                          "
                          placeholder="Etikett för kommentar 3"
                        />
                        <p
                          v-else
                          class="text-sm bg-muted p-2 rounded"
                        >
                          {{ selectedOrganization.kommentarLabels.kommentar3 }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="editingOrgInfo"
                    class="flex gap-4 justify-end pt-4 border-t"
                  >
                    <Button
                      variant="outline"
                      @click="editingOrgInfo = false"
                    >
                      Avbryt
                    </Button>
                    <Button
                      class="gap-2"
                      @click="saveOrganizationInfo"
                    >
                      <Save class="h-4 w-4" />
                      Spara ändringar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <!-- Units Tab -->
            <TabsContent
              value="units"
              class="space-y-6"
            >
              <UnitManager
                :units="selectedOrganization.enheter"
                :organization-name="selectedOrganization.namn"
                @add-unit="addUnit"
                @remove-unit="removeUnit"
              />
            </TabsContent>

            <!-- Users Tab -->
            <TabsContent
              value="users"
              class="space-y-6"
            >
              <Card>
                <CardHeader>
                  <div class="flex items-center justify-between">
                    <CardTitle class="flex items-center gap-2">
                      <Users class="h-5 w-5" />
                      Användare för {{ selectedOrganization.namn }}
                    </CardTitle>
                    <Button
                      class="gap-2"
                      @click="$router.push('/admin/users')"
                    >
                      <Users class="h-4 w-4" />
                      Hantera användare
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div class="space-y-4">
                    <!-- Summary -->
                    <div class="bg-muted/50 p-4 rounded-lg">
                      <h4 class="font-medium mb-2">Användaröversikt</h4>
                      <div
                        class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"
                      >
                        <div>
                          <div class="font-medium text-lg">
                            {{ organizationUsers.length }}
                          </div>
                          <div class="text-muted-foreground">
                            Totalt användare
                          </div>
                        </div>
                        <div>
                          <div class="font-medium text-lg">
                            {{
                              organizationUsers.filter((u) => u.aktiv).length
                            }}
                          </div>
                          <div class="text-muted-foreground">Aktiva</div>
                        </div>
                        <div>
                          <div class="font-medium text-lg">
                            {{
                              organizationUsers.filter((u) =>
                                u.roller.includes("administrator")
                              ).length
                            }}
                          </div>
                          <div class="text-muted-foreground">
                            Administratörer
                          </div>
                        </div>
                        <div>
                          <div class="font-medium text-lg">
                            {{
                              organizationUsers.filter((u) =>
                                u.roller.includes("handlaggare")
                              ).length
                            }}
                          </div>
                          <div class="text-muted-foreground">Handläggare</div>
                        </div>
                      </div>
                    </div>

                    <!-- Recent Users -->
                    <div>
                      <h4 class="font-medium mb-3">Senaste användare</h4>
                      <div class="space-y-2">
                        <div
                          v-for="user in organizationUsers.slice(0, 5)"
                          :key="user.id"
                          class="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div class="space-y-1">
                            <div class="flex items-center gap-2">
                              <span class="font-medium">{{ user.namn }}</span>
                              <Badge
                                :variant="user.aktiv ? 'default' : 'outline'"
                                class="text-xs"
                              >
                                {{ user.aktiv ? "Aktiv" : "Inaktiv" }}
                              </Badge>
                            </div>
                            <p class="text-sm text-muted-foreground">
                              {{ user.epost }}
                            </p>
                            <div class="flex gap-1">
                              <Badge
                                v-for="role in user.roller"
                                :key="role"
                                :variant="getRoleColor(role)"
                                class="text-xs"
                              >
                                {{ getRoleDisplayName(role) }}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div
                          v-if="organizationUsers.length === 0"
                          class="text-center py-8 text-muted-foreground"
                        >
                          Inga användare finns för denna organisation
                        </div>
                        <div
                          v-else-if="organizationUsers.length > 5"
                          class="text-center pt-2"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            @click="$router.push('/admin/users')"
                          >
                            Visa alla {{ organizationUsers.length }} användare
                          </Button>
                        </div>
                      </div>
                    </div>

                    <!-- Info about user management -->
                    <div
                      class="bg-blue-50 border border-blue-200 p-4 rounded-lg"
                    >
                      <div class="flex items-start gap-3">
                        <Users class="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 class="font-medium text-blue-900 mb-1">
                            Fullständig användarhantering
                          </h4>
                          <p class="text-sm text-blue-700 mb-3">
                            För att skapa nya användare, hantera lösenord,
                            tilldela roller och behörigheter, använd den
                            dedikerade användarhanteringen.
                          </p>
                          <Button
                            size="sm"
                            class="gap-2"
                            @click="$router.push('/admin/users')"
                          >
                            <Users class="h-4 w-4" />
                            Gå till användarhantering
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  </PageLayout>
</template>
