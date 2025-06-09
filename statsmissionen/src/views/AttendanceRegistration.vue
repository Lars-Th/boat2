<script setup lang="ts">
import { computed } from "vue";
import PageLayout from "@/components/layout/PageLayout.vue";
import DataTable from "@/components/shared/DataTable.vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, QrCode } from "lucide-vue-next";

// Import JSON data
import attendancesData from "@/assets/data/attendances.json";
import activitiesData from "@/assets/data/activities.json";
import participantsData from "@/assets/data/participants.json";

// Enhanced attendance data
const enhancedAttendances = computed(() => {
  return attendancesData.map((attendance) => {
    const activity = activitiesData.find(
      (a) => a.ActivityID === attendance.ActivityID
    );
    const participant = participantsData.find(
      (p) => p.ParticipantID === attendance.ParticipantID
    );

    return {
      ...attendance,
      activityName: activity?.Namn ?? "Okänd aktivitet",
      participantName: participant ? `${participant.Fornamn} ${participant.Efternamn}` : "Okänd deltagare",
      activityDate: activity?.DatumTid ?? "",
      activityPlace: activity?.Plats ?? "",
    };
  });
});

// Recent attendances (last 7 days)
const recentAttendances = computed(() => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return enhancedAttendances.value
    .filter((a) => new Date(a.DatumTid) >= sevenDaysAgo)
    .sort(
      (a, b) => new Date(b.DatumTid).getTime() - new Date(a.DatumTid).getTime()
    );
});

// Table columns
const columns = [
  {
    key: "participantName",
    label: "Deltagare",
    sortable: true,
  },
  {
    key: "activityName",
    label: "Aktivitet",
    sortable: true,
  },
  {
    key: "DatumTid",
    label: "Registrerad",
    sortable: true,
    format: (value: string) => new Date(value).toLocaleString("sv-SE"),
  },
  {
    key: "Närvaro",
    label: "Status",
    sortable: true,
  },
  {
    key: "Anteckningar",
    label: "Anteckningar",
    sortable: false,
  },
];

// Statistics
const stats = computed(() => [
  {
    title: "Totalt registreringar",
    value: attendancesData.length,
    icon: CheckCircle,
    color: "blue",
  },
  {
    title: "Närvarande",
    value: attendancesData.filter((a) => a.Närvaro).length,
    icon: CheckCircle,
    color: "green",
  },
  {
    title: "Frånvarande",
    value: attendancesData.filter((a) => !a.Närvaro).length,
    icon: XCircle,
    color: "red",
  },
  {
    title: "Senaste veckan",
    value: recentAttendances.value.length,
    icon: Clock,
    color: "purple",
  },
]);
</script>

<template>
  <PageLayout
    title="Närvaroregistrering"
    breadcrumbs="Dashboard / Aktiviteter / Närvaroregistrering"
    show-stats
    :stats="stats"
  >
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- QR Code Scanner -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <QrCode class="h-5 w-5" />
            QR-kod Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col items-center gap-4">
            <div
              class="w-32 h-32 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center"
            >
              <QrCode class="h-12 w-12 text-muted-foreground" />
            </div>
            <Button class="w-full"> Starta Scanner </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Quick Registration -->
      <Card>
        <CardHeader>
          <CardTitle>Snabbregistrering</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <Button
              variant="outline"
              class="w-full justify-start gap-2"
            >
              <CheckCircle class="h-4 w-4 text-green-600" />
              Registrera närvaro
            </Button>
            <Button
              variant="outline"
              class="w-full justify-start gap-2"
            >
              <XCircle class="h-4 w-4 text-red-600" />
              Registrera frånvaro
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Today's Activities -->
      <Card>
        <CardHeader>
          <CardTitle>Dagens aktiviteter</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div
              v-for="activity in activitiesData.slice(0, 3)"
              :key="activity.ActivityID"
              class="p-2 border rounded text-sm"
            >
              <div class="font-medium">
                {{ activity.Namn }}
              </div>
              <div class="text-muted-foreground">
                {{ activity.Plats }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Senaste registreringar</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          :data="recentAttendances"
          :columns="columns"
        >
          <template #cell-Närvaro="{ value }">
            <Badge :variant="value ? 'default' : 'destructive'">
              <CheckCircle
                v-if="value"
                class="h-3 w-3 mr-1"
              />
              <XCircle
                v-else
                class="h-3 w-3 mr-1"
              />
              {{ value ? "Närvarande" : "Frånvarande" }}
            </Badge>
          </template>

          <template #cell-Anteckningar="{ value }">
            <span class="text-sm text-muted-foreground">
              {{ value || "Inga anteckningar" }}
            </span>
          </template>
        </DataTable>
      </CardContent>
    </Card>
  </PageLayout>
</template>
