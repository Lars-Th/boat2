<script setup lang="ts">
import { ref } from 'vue'
import { useProspectorStore } from '@/storages/prospectorStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Lock, Key } from 'lucide-vue-next'

const prospectorStore = useProspectorStore()

// Form state
const activationCode = ref('')
const isSubmitting = ref(false)
const validationError = ref('')

// Form submission
const handleSubmit = async () => {
  if (!activationCode.value.trim()) {
    validationError.value = 'Please enter an activation code'
    return
  }

  isSubmitting.value = true
  validationError.value = ''

  try {
    const success = await prospectorStore.validateActivationCode(activationCode.value.trim())
    
    if (success) {
      // Redirect is handled by the parent component watching isAuthenticated
      // We could also programmatically redirect here
    } else {
      validationError.value = prospectorStore.error || 'Invalid activation code'
    }
  } catch (error) {
    validationError.value = 'An error occurred during validation'
  } finally {
    isSubmitting.value = false
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleSubmit()
  }
}
</script>

<template>
  <Card class="w-full max-w-md mx-auto">
    <CardHeader class="text-center space-y-4">
      <div class="mx-auto bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-16 h-16 flex items-center justify-center">
        <Key class="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <CardTitle class="text-2xl font-bold">Welcome to Mindbite</CardTitle>
        <CardDescription class="text-base mt-2">
          Enter your activation code to access the the best service you can dream of
        </CardDescription>
      </div>
    </CardHeader>
    
    <CardContent class="space-y-6">
      <!-- Activation Code Input -->
      <div class="space-y-2">
        <Label for="activation-code" class="text-sm font-medium">
          Activation Code
        </Label>
        <div class="relative">
          <Lock class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="activation-code"
            v-model="activationCode"
            type="text"
            placeholder="Enter your activation code"
            class="pl-10"
            :disabled="isSubmitting"
            @keypress="handleKeyPress"
          />
        </div>
      </div>

      <!-- Error Alert -->
      <Alert v-if="validationError" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>
          {{ validationError }}
        </AlertDescription>
      </Alert>

      <!-- Submit Button -->
      <Button 
        @click="handleSubmit"
        :disabled="isSubmitting || !activationCode.trim()"
        class="w-full"
      >
        <span v-if="isSubmitting" class="flex items-center gap-2">
          <div class="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Validating...
        </span>
        <span v-else>
          Activate Account
        </span>
      </Button>

      <!-- Information -->
      <div class="text-center text-sm text-muted-foreground">
        <p>
          Don't have an activation code? 
          <a href="#" class="text-primary hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Component-specific styles if needed */
</style> 