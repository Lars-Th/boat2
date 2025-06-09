<template>
  <div class="px-6 py-4">
    <h3 class="text-lg font-semibold mb-4">
      Rollbeskrivningar
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card
        v-for="role in roleDefinitions"
        :key="role.id"
      >
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium flex items-center gap-2">
            <component
              :is="role.icon"
              class="h-4 w-4"
            />
            {{ role.namn }}
            <Badge
              :variant="role.color"
              class="text-xs"
            >
              {{ role.id }}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-xs text-muted-foreground mb-2">
            {{ role.beskrivning }}
          </p>
          <div class="text-xs">
            <p>
              <strong>Stadsmissioner:</strong>
              {{ role.organizationScope === "all" ? "Alla" : "En specifik" }}
            </p>
            <p>
              <strong>Enheter:</strong>
              {{ role.unitScope === "all" ? "Alla" : "Valda enheter" }}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck } from "lucide-vue-next";

// Types
interface RoleDefinition {
  id: string;
  namn: string;
  beskrivning: string;
  color: "default" | "destructive" | "outline" | "secondary";
  icon: typeof UserCheck;
  permissions: string[];
  organizationScope: string;
  unitScope: string;
}

// Props
interface Props {
  roleDefinitions: RoleDefinition[];
}

defineProps<Props>();
</script> 