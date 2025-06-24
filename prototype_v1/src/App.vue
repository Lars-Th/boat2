<script setup lang="ts">
import { RouterView, useRouter, useRoute } from "vue-router";
import { mainNavigationItems, bottomNavigationItems } from "@/router/index";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import ToastContainer from "@/components/ui/ToastContainer.vue";
import { ref, onMounted } from "vue";
import { Palette, User, LogOut, Settings } from "lucide-vue-next";
import { useAuthStore } from "@/storages/authStore";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const themes = [
  { name: "Default", value: "default", class: "" },
  { name: "Dark", value: "dark", class: "dark" },
  { name: "Fuchsia", value: "fuchsia", class: "theme_fuchsia" },
  { name: "Purple", value: "purple", class: "theme_purple" },
  { name: "Amber", value: "amber", class: "theme_amber" },
  { name: "Sky", value: "sky", class: "theme_sky" },
  { name: "Pink", value: "pink", class: "theme_pink" },
];

const currentTheme = ref("default");

// Simulerad användarinfo
const currentUser = {
  name: "Lars Thomas",
  email: "lars.thomas@example.com",
  role: "Administrator",
};

const navigateTo = (path: string) => {
  router.push(path);
};

const isActiveRoute = (path: string) => {
  return route.path === path;
};

const setTheme = (theme: (typeof themes)[0]) => {
  currentTheme.value = theme.value;

  // Remove all theme classes
  document.documentElement.classList.remove(
    "dark",
    "theme_fuchsia",
    "theme_purple",
    "theme_amber",
    "theme_sky",
    "theme_pink"
  );

  // Add the new theme class if it's not default
  if (theme.class) {
    document.documentElement.classList.add(theme.class);
  }

  // Store theme preference
  localStorage.setItem("theme", theme.value);
};

// Load saved theme on mount
onMounted(() => {
  const savedTheme = localStorage.getItem("theme") || "default";
  const theme = themes.find((t) => t.value === savedTheme) || themes[0];
  setTheme(theme);
});
</script>

<template>
  <div class="flex h-screen bg-background">
    <!-- Fixed Sidebar -->
    <aside class="w-64 bg-card border-r border-border flex flex-col">
      <!-- Sidebar Header -->
      <div class="p-8 border-b border-border">
        <h1 class="text-xl font-semibold text-foreground">
          MoxMaster
        </h1>
      </div>

      <!-- Main Navigation Section -->
      <nav class="flex-1 p-4 space-y-1">
        <Button
          v-for="item in mainNavigationItems"
          :key="item.path"
          :variant="isActiveRoute(item.path) ? 'default' : 'ghost'"
          class="w-full justify-start gap-3 h-10"
          @click="navigateTo(item.path)"
        >
          <component
            :is="item.icon"
            class="h-4 w-4"
          />
          {{ item.name }}
        </Button>
      </nav>

      <!-- Bottom Navigation Section -->
      <div class="p-4 space-y-1">
        <Separator class="mb-3" />

        <!-- Bottom Navigation Items -->
        <template
          v-for="item in bottomNavigationItems"
          :key="item.path"
        >
          <!-- Regular navigation item without dropdown -->
          <Button
            v-if="!item.dropdown"
            :variant="isActiveRoute(item.path) ? 'default' : 'ghost'"
            class="w-full justify-start gap-3 h-10"
            @click="navigateTo(item.path)"
          >
            <component
              :is="item.icon"
              class="h-4 w-4"
            />
            {{ item.name }}
          </Button>

          <!-- Dropdown navigation item -->
          <DropdownMenu v-else>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                class="w-full justify-start gap-3 h-10"
              >
                <component
                  :is="item.icon"
                  class="h-4 w-4"
                />
                <span class="flex-1 text-left">{{ item.name }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              class="w-56"
            >
              <template
                v-for="section in item.dropdown"
                :key="section.name"
              >
                <DropdownMenuLabel class="flex items-center gap-2">
                  <component
                    :is="section.icon"
                    class="h-4 w-4"
                  />
                  {{ section.name }}
                </DropdownMenuLabel>
                <template
                  v-for="child in section.children"
                  :key="child.path"
                >
                  <DropdownMenuItem
                    class="cursor-pointer pl-6"
                    @click="navigateTo(child.path)"
                  >
                    <component
                      :is="child.icon"
                      class="mr-2 h-4 w-4"
                    />
                    {{ child.name }}
                  </DropdownMenuItem>
                </template>
                <DropdownMenuSeparator
                  v-if="
                    item.dropdown.indexOf(section) < item.dropdown.length - 1
                  "
                />
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </template>

        <!-- Theme Switcher -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              class="w-full justify-start gap-3 h-10"
            >
              <Palette class="h-4 w-4" />
              <span class="flex-1 text-left">Themes</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            class="w-48"
          >
            <DropdownMenuLabel>Välj tema</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              v-for="theme in themes"
              :key="theme.value"
              class="cursor-pointer"
              @click="setTheme(theme)"
            >
              <span class="flex items-center">
                <span
                  class="w-3 h-3 rounded-full mr-2 border"
                  :class="{
                    'bg-gray-100 border-gray-300': theme.value === 'default',
                    'bg-gray-800 border-gray-600': theme.value === 'dark',
                    'bg-fuchsia-500 border-fuchsia-600':
                      theme.value === 'fuchsia',
                    'bg-purple-500 border-purple-600': theme.value === 'purple',
                    'bg-amber-500 border-amber-600': theme.value === 'amber',
                    'bg-sky-500 border-sky-600': theme.value === 'sky',
                    'bg-pink-500 border-pink-600': theme.value === 'pink',
                  }"
                />
                {{ theme.name }}
                <span
                  v-if="currentTheme === theme.value"
                  class="ml-auto"
                >✓</span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      <!-- User Info -->
      <div class="p-4">
        <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div class="flex-shrink-0">
            <div
              class="w-8 h-8 bg-primary rounded-full flex items-center justify-center"
            >
              <User class="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-foreground truncate">
              {{ currentUser.name }}
            </p>
            <p class="text-xs text-muted-foreground truncate">
              {{ currentUser.role }}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0"
              >
                <LogOut class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              class="w-48"
            >
              <DropdownMenuLabel>{{ currentUser.email }}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="cursor-pointer">
                <User class="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer">
                <Settings class="mr-2 h-4 w-4" />
                Inställningar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="cursor-pointer text-red-600">
                <LogOut class="mr-2 h-4 w-4" />
                <div @click.stop="authStore.logout">
                  Logga ut
                </div>
                <!-- authStore.logout(); -->
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-auto">
      <RouterView />
    </main>

    <!-- Toast Container -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
