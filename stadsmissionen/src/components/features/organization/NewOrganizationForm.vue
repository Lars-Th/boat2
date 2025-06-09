<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button class="gap-2">
        <Plus class="h-4 w-4" />
        Ny stadsmission
      </Button>
    </DialogTrigger>
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Skapa ny stadsmission</DialogTitle>
      </DialogHeader>
      <form
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="orgNamn">Namn *</Label>
            <Input
              id="orgNamn"
              v-model="form.namn"
              placeholder="T.ex. Göteborgs Stadsmission"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="orgLogotyp">Logotyp (URL)</Label>
            <Input
              id="orgLogotyp"
              v-model="form.logotyp"
              placeholder="/src/assets/images/logo.png"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <Label for="orgAdress">Adress</Label>
            <Input
              id="orgAdress"
              v-model="form.kontaktuppgifter.adress"
              placeholder="Storgatan 1"
            />
          </div>
          <div class="space-y-2">
            <Label for="orgPostnummer">Postnummer</Label>
            <Input
              id="orgPostnummer"
              v-model="form.kontaktuppgifter.postnummer"
              placeholder="12345"
            />
          </div>
          <div class="space-y-2">
            <Label for="orgOrt">Ort</Label>
            <Input
              id="orgOrt"
              v-model="form.kontaktuppgifter.ort"
              placeholder="Göteborg"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="orgTelefon">Telefon</Label>
            <Input
              id="orgTelefon"
              v-model="form.kontaktuppgifter.telefon"
              placeholder="031-123456"
            />
          </div>
          <div class="space-y-2">
            <Label for="orgEpost">E-post</Label>
            <Input
              id="orgEpost"
              v-model="form.kontaktuppgifter.epost"
              type="email"
              placeholder="info@goteborgsstadsmission.se"
            />
          </div>
        </div>

        <div class="flex gap-4 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            @click="handleCancel"
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            :disabled="!form.namn.trim() || isSubmitting"
            class="gap-2"
          >
            <Plus class="h-4 w-4" />
            {{ isSubmitting ? 'Skapar...' : 'Skapa stadsmission' }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-vue-next'

interface OrganizationForm {
  namn: string
  logotyp: string
  enheter: string[]
  kommentarLabels: {
    kommentar1: string
    kommentar2: string
    kommentar3: string
  }
  kontaktuppgifter: {
    adress: string
    postnummer: string
    ort: string
    telefon: string
    epost: string
    webbplats: string
  }
}

interface Props {
  modelValue: boolean
}

interface Emits {
  'update:modelValue': [value: boolean]
  'submit': [formData: OrganizationForm]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isSubmitting = ref(false)

const isOpen = ref(props.modelValue)

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue
})

// Watch for internal changes to isOpen
watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue)
})

const form = reactive<OrganizationForm>({
  namn: '',
  logotyp: '',
  enheter: [],
  kommentarLabels: {
    kommentar1: 'Särskilda behov',
    kommentar2: 'Familjesituation',
    kommentar3: 'Övriga anteckningar',
  },
  kontaktuppgifter: {
    adress: '',
    postnummer: '',
    ort: '',
    telefon: '',
    epost: '',
    webbplats: '',
  },
})

const resetForm = () => {
  form.namn = ''
  form.logotyp = ''
  form.enheter = []
  form.kommentarLabels = {
    kommentar1: 'Särskilda behov',
    kommentar2: 'Familjesituation',
    kommentar3: 'Övriga anteckningar',
  }
  form.kontaktuppgifter = {
    adress: '',
    postnummer: '',
    ort: '',
    telefon: '',
    epost: '',
    webbplats: '',
  }
}

const handleSubmit = async () => {
  if (!form.namn.trim()) return
  
  isSubmitting.value = true
  
  try {
    // Create a copy of the form data
    const formData = {
      ...form,
      kommentarLabels: { ...form.kommentarLabels },
      kontaktuppgifter: { ...form.kontaktuppgifter },
    }
    
    emit('submit', formData)
    resetForm()
    isOpen.value = false
  } catch (error) {
    console.error('Error creating organization:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  resetForm()
  isOpen.value = false
}
</script> 