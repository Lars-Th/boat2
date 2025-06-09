<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, MapPin, Save, User } from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

// Import organization settings
import organizationSettings from '@/assets/data/organizationSettings.json';

const router = useRouter();
const { success, warning } = useToast();

// Get current organization
const currentOrg = organizationSettings.organizations.find(
  org => org.id === organizationSettings.currentOrganization
);
const enheter = currentOrg?.enheter ?? [];
const kommentarLabels = currentOrg?.kommentarLabels ?? {
  kommentar1: 'Kommentar 1',
  kommentar2: 'Kommentar 2',
  kommentar3: 'Kommentar 3',
};

// Form data with new structure
const form = ref({
  fornamn: '',
  efternamn: '',
  personnummer: '',
  kon: '',
  telefon: '',
  epost: '',
  adress: '',
  postnummer: '',
  ort: '',
  kartkoordinater: {
    lat: null as number | null,
    lng: null as number | null,
  },
  enheter: [] as string[],
  kommentar1: '',
  kommentar2: '',
  kommentar3: '',
});

// Available options
const konOptions = ['Man', 'Kvinna', 'Annat', 'Vill ej uppge'];

// Validation
const isFormValid = computed(() => {
  return (
    form.value.fornamn.trim() !== '' &&
    form.value.efternamn.trim() !== '' &&
    form.value.kon !== '' &&
    form.value.adress.trim() !== '' &&
    form.value.postnummer.trim() !== '' &&
    form.value.ort.trim() !== '' &&
    form.value.enheter.length > 0
  );
});

// Handle unit selection
const handleUnitChange = (unit: string, checked: boolean | string) => {
  const isChecked = checked === true || checked === 'true';
  if (isChecked) {
    form.value.enheter.push(unit);
  } else {
    const index = form.value.enheter.indexOf(unit);
    if (index > -1) {
      form.value.enheter.splice(index, 1);
    }
  }
};

// Geocode address (simplified - in real app would use proper geocoding service)
const geocodeAddress = async () => {
  if (form.value.adress && form.value.ort) {
    // Simplified geocoding - in real app would call actual geocoding API
    // For now, just set Stockholm coordinates as example
    form.value.kartkoordinater = {
      lat: 59.3293 + (Math.random() - 0.5) * 0.1,
      lng: 18.0686 + (Math.random() - 0.5) * 0.1,
    };
  }
};

// Save participant
const handleSave = async () => {
  if (!isFormValid.value) {
    warning('Validering misslyckades', 'Vänligen fyll i alla obligatoriska fält');
    return;
  }

  await geocodeAddress();
  console.log('Saving participant:', form.value);
  success('Deltagare sparad', 'Den nya deltagaren har registrerats framgångsrikt');
  router.push('/participants');
};

const handleCancel = () => {
  router.push('/participants');
};

// Validate personnummer format (optional)
const validatePersonnummer = (value: string) => {
  if (!value) return true; // Optional field
  const cleaned = value.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 12;
};
</script>

<template>
  <PageLayout title="Ny deltagare" breadcrumbs="Dashboard / Deltagare / Ny deltagare">
    <div class="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <User class="h-5 w-5" />
            Lägg till ny deltagare
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Namn -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="fornamn">Förnamn *</Label>
              <Input id="fornamn" v-model="form.fornamn" placeholder="Förnamn" required />
            </div>

            <div class="space-y-2">
              <Label for="efternamn">Efternamn *</Label>
              <Input id="efternamn" v-model="form.efternamn" placeholder="Efternamn" required />
            </div>
          </div>

          <!-- Personnummer och Kön -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="personnummer">Personnummer</Label>
              <Input
                id="personnummer"
                v-model="form.personnummer"
                placeholder="YYYYMMDDXXXX (valfritt)"
                :class="{
                  'border-red-500': form.personnummer && !validatePersonnummer(form.personnummer),
                }"
              />
              <p
                v-if="form.personnummer && !validatePersonnummer(form.personnummer)"
                class="text-sm text-red-500"
              >
                Personnummer ska vara 10 eller 12 siffror
              </p>
            </div>

            <div class="space-y-2">
              <Label for="kon">Kön *</Label>
              <Select v-model="form.kon">
                <SelectTrigger>
                  <SelectValue placeholder="Välj kön" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="kon in konOptions" :key="kon" :value="kon">
                    {{ kon }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Kontaktuppgifter -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="telefon">Telefon</Label>
              <Input id="telefon" v-model="form.telefon" placeholder="070-123 45 67" type="tel" />
            </div>

            <div class="space-y-2">
              <Label for="epost">E-post</Label>
              <Input id="epost" v-model="form.epost" placeholder="namn@exempel.se" type="email" />
            </div>
          </div>

          <!-- Adress -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium">Adress</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="md:col-span-2 space-y-2">
                <Label for="adress">Gatuadress *</Label>
                <Input id="adress" v-model="form.adress" placeholder="Storgatan 12" required />
              </div>

              <div class="space-y-2">
                <Label for="postnummer">Postnummer *</Label>
                <Input id="postnummer" v-model="form.postnummer" placeholder="111 22" required />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="ort">Ort *</Label>
                <Input id="ort" v-model="form.ort" placeholder="Stockholm" required />
              </div>

              <div class="space-y-2">
                <Label class="flex items-center gap-2">
                  <MapPin class="h-4 w-4" />
                  Kartkoordinater (fylls i automatiskt)
                </Label>
                <div class="text-sm text-muted-foreground">
                  {{
                    form.kartkoordinater.lat && form.kartkoordinater.lng
                      ? `${form.kartkoordinater.lat.toFixed(4)}, ${form.kartkoordinater.lng.toFixed(4)}`
                      : 'Kommer att beräknas från adress'
                  }}
                </div>
              </div>
            </div>
          </div>

          <!-- Enheter -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium">Enheter *</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div v-for="enhet in enheter" :key="enhet" class="flex items-center space-x-2">
                <Checkbox
                  :id="enhet"
                  :checked="form.enheter.includes(enhet)"
                  @update:checked="(checked: boolean) => handleUnitChange(enhet, checked)"
                />
                <Label :for="enhet" class="text-sm font-normal">{{ enhet }}</Label>
              </div>
            </div>
            <p v-if="form.enheter.length === 0" class="text-sm text-red-500">Välj minst en enhet</p>
          </div>

          <!-- Kommentarer -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium">Kommentarer</h3>

            <div class="space-y-2">
              <Label for="kommentar1">{{ kommentarLabels.kommentar1 }}</Label>
              <Textarea
                id="kommentar1"
                v-model="form.kommentar1"
                :placeholder="`Ange ${kommentarLabels.kommentar1.toLowerCase()}...`"
                rows="2"
              />
            </div>

            <div class="space-y-2">
              <Label for="kommentar2">{{ kommentarLabels.kommentar2 }}</Label>
              <Textarea
                id="kommentar2"
                v-model="form.kommentar2"
                :placeholder="`Ange ${kommentarLabels.kommentar2.toLowerCase()}...`"
                rows="2"
              />
            </div>

            <div class="space-y-2">
              <Label for="kommentar3">{{ kommentarLabels.kommentar3 }}</Label>
              <Textarea
                id="kommentar3"
                v-model="form.kommentar3"
                :placeholder="`Ange ${kommentarLabels.kommentar3.toLowerCase()}...`"
                rows="2"
              />
            </div>
          </div>

          <div class="flex gap-4 pt-4">
            <Button :disabled="!isFormValid" class="gap-2" @click="handleSave">
              <Save class="h-4 w-4" />
              Spara deltagare
            </Button>
            <Button variant="outline" class="gap-2" @click="handleCancel">
              <ArrowLeft class="h-4 w-4" />
              Avbryt
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </PageLayout>
</template>
