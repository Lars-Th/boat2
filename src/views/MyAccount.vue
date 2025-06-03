<script setup lang="ts">
import { ref } from 'vue'
import StandardHeader from '@/components/custom/StandardHeader.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-vue-next'

interface BreadcrumbItem {
  label: string
  to?: string | { name: string; params?: Record<string, any> }
  isCurrentPage?: boolean
}

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Inställningar', to: '/settings' },
  { label: 'Mitt Konto', isCurrentPage: true }
]

// User data
const userProfile = ref({
  firstName: 'Lars',
  lastName: 'Thomas',
  email: 'lars.thomas@example.com',
  phone: '+46 70 123 45 67',
  position: 'Systemadministratör',
  department: 'IT-avdelningen',
  address: 'Storgatan 123',
  city: 'Stockholm',
  postalCode: '11122',
  bio: 'Erfaren systemadministratör med fokus på industriella system och automation.',
  joinDate: '2020-03-15',
  lastLogin: '2024-01-15 14:30'
})

const isEditing = ref(false)

const toggleEdit = () => {
  isEditing.value = !isEditing.value
}

const saveProfile = () => {
  // TODO: Implement save functionality
  console.log('Saving profile:', userProfile.value)
  isEditing.value = false
}

const cancelEdit = () => {
  // TODO: Reset to original values
  isEditing.value = false
}
</script>

<template>
  <div class="w-full">
    <StandardHeader
      title="Mitt Konto"
      :breadcrumbs="breadcrumbs"
      description="Hantera din personliga profil och kontoinställningar"
    />

    <div class="p-6 max-w-4xl mx-auto space-y-6">
      <!-- Profile Overview Card -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <User class="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <CardTitle class="text-xl">{{ userProfile.firstName }} {{ userProfile.lastName }}</CardTitle>
                <CardDescription class="text-base">{{ userProfile.position }}</CardDescription>
              </div>
            </div>
            <Button 
              v-if="!isEditing" 
              @click="toggleEdit"
              variant="outline"
            >
              Redigera Profil
            </Button>
            <div v-else class="space-x-2">
              <Button @click="saveProfile" size="sm">Spara</Button>
              <Button @click="cancelEdit" variant="outline" size="sm">Avbryt</Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <!-- Personal Information -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <User class="h-5 w-5" />
            Personlig Information
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="firstName">Förnamn</Label>
              <Input
                id="firstName"
                v-model="userProfile.firstName"
                :disabled="!isEditing"
                :class="{ 'bg-muted': !isEditing }"
              />
            </div>
            <div class="space-y-2">
              <Label for="lastName">Efternamn</Label>
              <Input
                id="lastName"
                v-model="userProfile.lastName"
                :disabled="!isEditing"
                :class="{ 'bg-muted': !isEditing }"
              />
            </div>
            <div class="space-y-2">
              <Label for="position">Befattning</Label>
              <Input
                id="position"
                v-model="userProfile.position"
                :disabled="!isEditing"
                :class="{ 'bg-muted': !isEditing }"
              />
            </div>
            <div class="space-y-2">
              <Label for="department">Avdelning</Label>
              <Input
                id="department"
                v-model="userProfile.department"
                :disabled="!isEditing"
                :class="{ 'bg-muted': !isEditing }"
              />
            </div>
          </div>
          <div class="space-y-2">
            <Label for="bio">Beskrivning</Label>
            <Textarea
              id="bio"
              v-model="userProfile.bio"
              :disabled="!isEditing"
              :class="{ 'bg-muted': !isEditing }"
              rows="3"
            />
          </div>
        </CardContent>
      </Card>

      <!-- Contact Information -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Mail class="h-5 w-5" />
            Kontaktinformation
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="email">E-post</Label>
              <Input
                id="email"
                v-model="userProfile.email"
                type="email"
                :disabled="!isEditing"
                :class="{ 'bg-muted': !isEditing }"
              />
            </div>
            <div class="space-y-2">
              <Label for="phone">Telefon</Label>
              <Input
                id="phone"
                v-model="userProfile.phone"
                :disabled="!isEditing"
                :class="{ 'bg-muted': !isEditing }"
              />
            </div>
            <div class="space-y-2">
              <Label for="address">Adress</Label>
              <Input
                id="address"
                v-model="userProfile.address"
                :disabled="!isEditing"
                :class="{ 'bg-muted': !isEditing }"
              />
            </div>
            <div class="space-y-2">
              <Label for="city">Stad</Label>
              <Input
                id="city"
                v-model="userProfile.city"
                :disabled="!isEditing"
                :class="{ 'bg-muted': !isEditing }"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Account Information -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Shield class="h-5 w-5" />
            Kontoinformation
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Medlem sedan</Label>
              <div class="flex items-center gap-2 p-2 bg-muted rounded">
                <Calendar class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm">{{ new Date(userProfile.joinDate).toLocaleDateString('sv-SE') }}</span>
              </div>
            </div>
            <div class="space-y-2">
              <Label>Senaste inloggning</Label>
              <div class="flex items-center gap-2 p-2 bg-muted rounded">
                <User class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm">{{ userProfile.lastLogin }}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Security Section -->
      <Card>
        <CardHeader>
          <CardTitle>Säkerhet</CardTitle>
          <CardDescription>Hantera ditt lösenord och säkerhetsinställningar</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Button variant="outline" class="w-full md:w-auto">
            Ändra Lösenord
          </Button>
          <Separator />
          <div class="text-sm text-muted-foreground">
            <p>För att ändra ditt lösenord eller andra säkerhetsinställningar, kontakta systemadministratören.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template> 