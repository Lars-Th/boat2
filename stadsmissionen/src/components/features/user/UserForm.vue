<template>
  <div class="space-y-6">
    <!-- Basic Info -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label for="userName">Namn *</Label>
        <Input
          id="userName"
          :model-value="user.namn"
          placeholder="För- och efternamn"
          required
          @update:model-value="(value) => updateUser('namn', value as string)"
        />
      </div>
      <div class="space-y-2">
        <Label for="userEmail">E-post *</Label>
        <Input
          id="userEmail"
          :model-value="user.epost"
          type="email"
          placeholder="anvandare@stadsmission.se"
          required
          @update:model-value="(value) => updateUser('epost', value as string)"
        />
      </div>
    </div>

    <!-- Password -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label for="userPassword">Lösenord *</Label>
        <div class="relative">
          <Input
            id="userPassword"
            :model-value="user.losenord"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Minst 8 tecken"
            required
            @update:model-value="(value) => updateUser('losenord', value as string)"
          />
          <Button
            variant="ghost"
            size="sm"
            class="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            @click="showPassword = !showPassword"
          >
            <Eye
              v-if="!showPassword"
              class="h-4 w-4"
            />
            <EyeOff
              v-else
              class="h-4 w-4"
            />
          </Button>
        </div>
      </div>
      <div class="space-y-2">
        <Label for="confirmPassword">Bekräfta lösenord *</Label>
        <div class="relative">
          <Input
            id="confirmPassword"
            :model-value="user.confirmLosenord"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Upprepa lösenordet"
            required
            @update:model-value="(value) => updateUser('confirmLosenord', value as string)"
          />
          <Button
            variant="ghost"
            size="sm"
            class="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <Eye
              v-if="!showConfirmPassword"
              class="h-4 w-4"
            />
            <EyeOff
              v-else
              class="h-4 w-4"
            />
          </Button>
        </div>
      </div>
    </div>

    <!-- Roles -->
    <div class="space-y-4">
      <Label>Roller *</Label>
      <div class="space-y-3">
        <div
          v-for="role in roleDefinitions"
          :key="role.id"
          class="flex items-start space-x-3 p-3 border rounded-lg"
        >
          <Checkbox
            :id="role.id"
            :checked="user.roller.includes(role.id)"
            @update:checked="(checked: boolean) => handleRoleChange(role.id, checked)"
          />
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <component
                :is="role.icon"
                class="h-4 w-4"
              />
              <Label
                :for="role.id"
                class="font-medium"
              >
                {{ role.namn }}
              </Label>
              <Badge
                :variant="role.color"
                class="text-xs"
              >
                {{ role.id }}
              </Badge>
            </div>
            <p class="text-sm text-muted-foreground mt-1">
              {{ role.beskrivning }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Organization -->
    <div
      v-if="shouldShowOrganization"
      class="space-y-2"
    >
      <Label>Stadsmission *</Label>
      <Select
        :model-value="user.organisationId"
        @update:model-value="(value) => updateUser('organisationId', value as string)"
      >
        <SelectTrigger>
          <SelectValue placeholder="Välj stadsmission" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="org in organizations"
            :key="org.id"
            :value="org.id"
          >
            {{ org.namn }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Units -->
    <div
      v-if="shouldShowUnits"
      class="space-y-2"
    >
      <Label>Enheter</Label>
      <div class="space-y-2">
        <div
          v-for="unit in availableUnits"
          :key="unit"
          class="flex items-center space-x-2"
        >
          <Checkbox
            :id="`unit-${unit}`"
            :checked="user.enheter.includes(unit)"
            @update:checked="(checked: boolean) => handleUnitChange(unit, checked)"
          />
          <Label :for="`unit-${unit}`">{{ unit }}</Label>
        </div>
      </div>
    </div>

    <!-- Active Status -->
    <div class="flex items-center space-x-2">
      <Switch
        :checked="user.aktiv"
        @update:checked="(checked: boolean) => updateUser('aktiv', checked)"
      />
      <Label>Användaren är aktiv</Label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, UserCheck } from "lucide-vue-next";

// Types
interface NewUser {
  namn: string;
  epost: string;
  losenord: string;
  confirmLosenord: string;
  roller: string[];
  organisationId: string;
  enheter: string[];
  aktiv: boolean;
}

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

interface Organization {
  id: string;
  namn: string;
  enheter: string[];
}

// Props
interface Props {
  user: NewUser;
  organizations: Organization[];
  roleDefinitions: RoleDefinition[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:user': [user: NewUser];
}>();

// Local state
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Computed
const shouldShowOrganization = computed(() => {
  return !props.user.roller.includes("systemadministrator");
});

const shouldShowUnits = computed(() => {
  return props.user.roller.some((roleId) => {
    const role = props.roleDefinitions.find((r) => r.id === roleId);
    return role?.unitScope === "selected";
  });
});

const availableUnits = computed(() => {
  if (!props.user.organisationId) return [];
  const org = props.organizations.find((o) => o.id === props.user.organisationId);
  return org?.enheter ?? [];
});

// Methods
const updateUser = <K extends keyof NewUser>(field: K, value: NewUser[K]) => {
  const updatedUser = { ...props.user, [field]: value };
  emit('update:user', updatedUser);
};

const handleRoleChange = (roleId: string, checked: boolean) => {
  const currentRoles = [...props.user.roller];
  
  if (checked) {
    if (!currentRoles.includes(roleId)) {
      currentRoles.push(roleId);
    }
  } else {
    const index = currentRoles.indexOf(roleId);
    if (index > -1) {
      currentRoles.splice(index, 1);
    }
  }
  
  updateUser('roller', currentRoles);
};

const handleUnitChange = (unitName: string, checked: boolean) => {
  const currentUnits = [...props.user.enheter];
  
  if (checked) {
    if (!currentUnits.includes(unitName)) {
      currentUnits.push(unitName);
    }
  } else {
    const index = currentUnits.indexOf(unitName);
    if (index > -1) {
      currentUnits.splice(index, 1);
    }
  }
  
  updateUser('enheter', currentUnits);
};
</script> 