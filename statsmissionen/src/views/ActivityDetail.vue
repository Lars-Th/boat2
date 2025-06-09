<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import PageLayout from "@/components/layout/PageLayout.vue";
import DataTable from "@/components/shared/DataTable.vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Save,
  X,
  UserCheck,
  UserX,
  BarChart3,
  ArrowLeft,
} from "lucide-vue-next";

// Import data
import activitiesData from "@/assets/data/activities.json";
import activityTypesData from "@/assets/data/activityTypes.json";
import participantsData from "@/assets/data/participants.json";
import attendancesData from "@/assets/data/attendances.json";
import type { ActivityType } from "@/types";

const route = useRoute();
const router = useRouter();

// Get activity ID from route
const activityId = computed(() => parseInt(route.params['id'] as string));

// Find the specific activity
const activity = computed(() => {
  return activitiesData.find((a) => a.ActivityID === activityId.value);
});

// Get activity type
const activityType = computed(() => {
  if (!activity.value) return null;
  return (activityTypesData as unknown as ActivityType[]).find(
    (at) => at.ActivityTypeID === activity.value?.ActivityTypeID
  );
});

// Get attendances for this activity
const attendances = computed(() => {
  return attendancesData.filter((a) => a.ActivityID === activityId.value);
});

// Get participants for this activity
const activityParticipants = computed(() => {
  const attendanceParticipantIds = attendances.value.map(
    (a) => a.ParticipantID
  );
  return participantsData.filter((p) =>
    attendanceParticipantIds.includes(p.ParticipantID)
  );
});

// Statistics
const stats = computed(() => {
  const totalAttendances = attendances.value.length;
  const presentCount = attendances.value.filter((a) => a.Närvaro).length;
  const absentCount = totalAttendances - presentCount;
  const attendanceRate =
    totalAttendances > 0
      ? Math.round((presentCount / totalAttendances) * 100)
      : 0;

  return [
    {
      title: "Totala registreringar",
      value: totalAttendances,
      color: "blue",
    },
    {
      title: "Närvarande",
      value: presentCount,
      color: "green",
    },
    {
      title: "Frånvarande",
      value: absentCount,
      color: "red",
    },
    {
      title: "Närvarograd",
      value: `${attendanceRate}%`,
      color: "purple",
    },
  ];
});

// Edit mode
const isEditing = ref(false);
const editForm = ref({
  Namn: "",
  Beskrivning: "",
  Plats: "",
  DatumTid: "",
  ActivityTypeID: 0,
});

// Initialize edit form
const initEditForm = () => {
  if (activity.value) {
    editForm.value = {
      Namn: activity.value.Namn,
      Beskrivning: activity.value.Beskrivning,
      Plats: activity.value.Plats,
      DatumTid: activity.value.DatumTid,
      ActivityTypeID: activity.value.ActivityTypeID,
    };
  }
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format time only
const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Attendance table columns
const attendanceColumns = [
  { key: "participant", label: "Deltagare" },
  { key: "attendance", label: "Närvaro" },
  { key: "datetime", label: "Registrerad" },
  { key: "notes", label: "Anteckningar" },
];

// Attendance table data
const attendanceTableData = computed(() => {
  return attendances.value.map((attendance) => {
    const participant = participantsData.find(
      (p) => p.ParticipantID === attendance.ParticipantID
    );
    return {
      id: attendance.AttendanceID,
      participant: participant ? `${participant.Fornamn} ${participant.Efternamn}` : "Okänd deltagare",
      attendance: attendance.Närvaro,
      datetime: attendance.DatumTid,
      notes: attendance.Anteckningar || "-",
    };
  });
});

// Save changes
const saveChanges = () => {
  // In a real app, this would make an API call
  console.log("Saving changes:", editForm.value);
  isEditing.value = false;
  // Here you would update the activity data
};

// Cancel editing
const cancelEdit = () => {
  isEditing.value = false;
  initEditForm();
};

// Go back to activity list
const goBack = () => {
  router.push("/activities");
};

// Initialize on mount
onMounted(() => {
  initEditForm();
});

// Breadcrumbs
const breadcrumbs = computed(() => {
  if (!activity.value) return "Aktiviteter / Aktivitet";
  return `Aktiviteter / ${activity.value.Namn}`;
});
</script>

<template>
  <PageLayout
    :title="activity?.Namn || 'Aktivitet'"
    :breadcrumbs="breadcrumbs"
    show-stats
    :stats="stats"
  >
    <div
      v-if="!activity"
      class="flex items-center justify-center h-64"
    >
      <div class="text-center">
        <h3 class="text-lg font-semibold text-muted-foreground">
          Aktivitet hittades inte
        </h3>
        <p class="text-sm text-muted-foreground mt-2">
          Den begärda aktiviteten kunde inte hittas.
        </p>
        <Button
          class="mt-4"
          @click="goBack"
        >
          <ArrowLeft class="mr-2 h-4 w-4" />
          Tillbaka till aktiviteter
        </Button>
      </div>
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <!-- Header Actions -->
      <div class="flex items-center justify-between">
        <Button
          variant="outline"
          @click="goBack"
        >
          <ArrowLeft class="mr-2 h-4 w-4" />
          Tillbaka
        </Button>

        <div class="flex gap-2">
          <Button
            v-if="!isEditing"
            variant="outline"
            @click="isEditing = true"
          >
            <Edit class="mr-2 h-4 w-4" />
            Redigera
          </Button>
          <template v-else>
            <Button
              variant="default"
              @click="saveChanges"
            >
              <Save class="mr-2 h-4 w-4" />
              Spara
            </Button>
            <Button
              variant="outline"
              @click="cancelEdit"
            >
              <X class="mr-2 h-4 w-4" />
              Avbryt
            </Button>
          </template>
        </div>
      </div>

      <!-- Activity Information -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Calendar class="h-5 w-5" />
            Aktivitetsinformation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            v-if="!isEditing"
            class="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div class="space-y-4">
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Namn</Label>
                <p class="text-lg font-semibold">
                  {{ activity.Namn }}
                </p>
              </div>

              <div>
                <Label class="text-sm font-medium text-muted-foreground">Typ</Label>
                <Badge
                  variant="secondary"
                  class="mt-1"
                >
                  {{ activityType?.Typnamn || "Okänd typ" }}
                </Badge>
              </div>

              <div>
                <Label class="text-sm font-medium text-muted-foreground">Plats</Label>
                <p class="flex items-center gap-2 mt-1">
                  <MapPin class="h-4 w-4 text-muted-foreground" />
                  {{ activity.Plats }}
                </p>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Datum och tid</Label>
                <p class="flex items-center gap-2 mt-1">
                  <Clock class="h-4 w-4 text-muted-foreground" />
                  {{ formatDate(activity.DatumTid) }}
                </p>
              </div>

              <div>
                <Label class="text-sm font-medium text-muted-foreground">Beskrivning</Label>
                <p class="mt-1 text-sm">
                  {{ activity.Beskrivning || "Ingen beskrivning tillgänglig" }}
                </p>
              </div>
            </div>
          </div>

          <!-- Edit Form -->
          <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div class="space-y-4">
              <div>
                <Label for="name">Namn</Label>
                <Input
                  id="name"
                  v-model="editForm.Namn"
                />
              </div>

              <div>
                <Label for="type">Typ</Label>
                <Select v-model="editForm.ActivityTypeID">
                  <SelectTrigger>
                    <SelectValue placeholder="Välj aktivitetstyp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="type in activityTypesData"
                      :key="type.ActivityTypeID"
                      :value="type.ActivityTypeID.toString()"
                    >
                      {{ type.Typnamn }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label for="location">Plats</Label>
                <Input
                  id="location"
                  v-model="editForm.Plats"
                />
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <Label for="datetime">Datum och tid</Label>
                <Input
                  id="datetime"
                  v-model="editForm.DatumTid"
                  type="datetime-local"
                />
              </div>

              <div>
                <Label for="description">Beskrivning</Label>
                <Textarea
                  id="description"
                  v-model="editForm.Beskrivning"
                  rows="3"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Tabs for different views -->
      <Tabs
        default-value="attendances"
        class="w-full"
      >
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger
            value="attendances"
            class="flex items-center gap-2"
          >
            <UserCheck class="h-4 w-4" />
            Närvaroregistreringar
          </TabsTrigger>
          <TabsTrigger
            value="participants"
            class="flex items-center gap-2"
          >
            <Users class="h-4 w-4" />
            Deltagare
          </TabsTrigger>
          <TabsTrigger
            value="statistics"
            class="flex items-center gap-2"
          >
            <BarChart3 class="h-4 w-4" />
            Statistik
          </TabsTrigger>
        </TabsList>

        <!-- Attendance Registrations -->
        <TabsContent
          value="attendances"
          class="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Närvaroregistreringar</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                :data="attendanceTableData"
                :columns="attendanceColumns"
              >
                <template #attendance="{ item }">
                  <Badge :variant="item.attendance ? 'default' : 'destructive'">
                    <UserCheck
                      v-if="item.attendance"
                      class="mr-1 h-3 w-3"
                    />
                    <UserX
                      v-else
                      class="mr-1 h-3 w-3"
                    />
                    {{ item.attendance ? "Närvarande" : "Frånvarande" }}
                  </Badge>
                </template>
                <template #datetime="{ item }">
                  {{ formatDate(item.datetime) }}
                </template>
                <template #notes="{ item }">
                  <span class="text-sm text-muted-foreground">{{
                    item.notes
                  }}</span>
                </template>
              </DataTable>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Participants -->
        <TabsContent
          value="participants"
          class="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                Deltagare ({{ activityParticipants.length }})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="participant in activityParticipants"
                  :key="participant.ParticipantID"
                  class="p-4 border rounded-lg"
                >
                  <h4 class="font-semibold">
                    {{ participant.Fornamn }} {{ participant.Efternamn }}
                  </h4>
                  <p class="text-sm text-muted-foreground">
                    {{ participant.Telefon }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    {{ participant["E-post"] }}
                  </p>

                  <!-- Attendance status for this participant -->
                  <div class="mt-2">
                    <Badge
                      v-for="attendance in attendances.filter(
                        (a) => a.ParticipantID === participant.ParticipantID
                      )"
                      :key="attendance.AttendanceID"
                      :variant="attendance.Närvaro ? 'default' : 'destructive'"
                      class="text-xs"
                    >
                      {{ formatTime(attendance.DatumTid) }} -
                      {{ attendance.Närvaro ? "Närvarande" : "Frånvarande" }}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Statistics -->
        <TabsContent
          value="statistics"
          class="space-y-4"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              v-for="stat in stats"
              :key="stat.title"
            >
              <CardContent class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-muted-foreground">
                      {{ stat.title }}
                    </p>
                    <p class="text-2xl font-bold">
                      {{ stat.value }}
                    </p>
                  </div>
                  <div
                    class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <BarChart3 class="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Additional Statistics -->
          <Card>
            <CardHeader>
              <CardTitle>Detaljerad statistik</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 class="font-semibold mb-2">Närvaroöversikt</h4>
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <span class="text-sm">Totala registreringar:</span>
                        <span class="font-medium">{{
                          attendances.length
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm">Unika deltagare:</span>
                        <span class="font-medium">{{
                          activityParticipants.length
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm">Genomsnittlig närvaro per deltagare:</span>
                        <span class="font-medium">
                          {{
                            activityParticipants.length > 0
                              ? (
                                attendances.length /
                                activityParticipants.length
                              ).toFixed(1)
                              : 0
                          }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 class="font-semibold mb-2">Aktivitetsinformation</h4>
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <span class="text-sm">Aktivitetstyp:</span>
                        <span class="font-medium">{{
                          activityType?.Typnamn || "Okänd"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm">Plats:</span>
                        <span class="font-medium">{{ activity.Plats }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm">Datum:</span>
                        <span class="font-medium">{{
                          formatDate(activity.DatumTid)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </PageLayout>
</template>
