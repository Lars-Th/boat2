<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-vue-next'
import { useAuthStore } from "@/storages/authStore";

const router = useRouter()
const authStore = useAuthStore();

// Form data
const loginForm = ref({
  email: '',
  password: '',
  rememberMe: false
})

// UI state
const isLoading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

// Form validation
const isFormValid = ref(false)

// Watch form changes for validation
const validateForm = () => {
  isFormValid.value = loginForm.value.email.length > 0 && loginForm.value.password.length > 0
}

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// Handle login
const handleLogin = async () => {
  if (!isFormValid.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    // TODO: Implement actual authentication logic
    console.log('Login attempt:', {
      email: loginForm.value.email,
      rememberMe: loginForm.value.rememberMe
    })
    
    // Login
    await authStore.login(loginForm.value.email, loginForm.value.password)
    
    // Redirect to dashboard on successful login
    router.push('/')
  } catch (error) {
    errorMessage.value = 'Inloggningen misslyckades. Kontrollera dina uppgifter och försök igen.'
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}

// Handle forgot password
const handleForgotPassword = () => {
  // TODO: Implement forgot password functionality
  console.log('Forgot password clicked')
}
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-background p-4">
    <div class="w-full max-w-md space-y-6">
      <!-- Logo/Brand Section -->
      <div class="text-center space-y-2">
        <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
          <LogIn class="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 class="text-2xl font-bold text-foreground">Välkommen tillbaka</h1>
        <p class="text-muted-foreground">Logga in på ditt konto för att fortsätta</p>
      </div>

      <!-- Login Form Card -->
      <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="text-xl text-center">Logga in</CardTitle>
          <CardDescription class="text-center">
            Ange dina inloggningsuppgifter nedan
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Error Message -->
          <div v-if="errorMessage" class="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {{ errorMessage }}
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" class="space-y-4">
            <!-- Email Field -->
            <div class="space-y-2">
              <Label for="email" class="text-sm font-medium">E-post</Label>
              <div class="relative">
                <Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  v-model="loginForm.email"
                  type="email"
                  placeholder="din.epost@exempel.se"
                  class="pl-10"
                  required
                  @input="validateForm"
                />
              </div>
            </div>

            <!-- Password Field -->
            <div class="space-y-2">
              <Label for="password" class="text-sm font-medium">Lösenord</Label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Ange ditt lösenord"
                  class="pl-10 pr-10"
                  required
                  @input="validateForm"
                />
                <button
                  type="button"
                  @click="togglePasswordVisibility"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Eye v-if="!showPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  v-model:checked="loginForm.rememberMe"
                />
                <Label for="remember" class="text-sm text-muted-foreground cursor-pointer">
                  Kom ihåg mig
                </Label>
              </div>
              <button
                type="button"
                @click="handleForgotPassword"
                class="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Glömt lösenord?
              </button>
            </div>

            <!-- Login Button -->
            <Button
              type="submit"
              class="w-full"
              :disabled="!isFormValid || isLoading"
            >
              <span v-if="isLoading" class="flex items-center gap-2">
                <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Loggar in...
              </span>
              <span v-else class="flex items-center gap-2">
                <LogIn class="h-4 w-4" />
                Logga in
              </span>
            </Button>
          </form>

          <Separator />

          <!-- Additional Options -->
          <div class="text-center space-y-2">
            <p class="text-sm text-muted-foreground">
              Har du inget konto?
              <button class="text-primary hover:text-primary/80 transition-colors font-medium">
                Kontakta administratör
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Footer -->
      <div class="text-center text-xs text-muted-foreground">
        <p>© 2024 Ditt Företag. Alla rättigheter förbehållna.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles if needed */
</style> 