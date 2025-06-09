<script setup lang="ts">
import { ref } from 'vue'
import PageLayout from '@/components/layout/PageLayout.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, FileText, Database, Calendar } from 'lucide-vue-next'

const exportFormat = ref('excel')
const dateFrom = ref('')
const dateTo = ref('')
const includePersonalData = ref(false)
const includeAttendance = ref(true)
const includeActivities = ref(true)
const includeFamilyRelations = ref(false)

const exportOptions = [
  { value: 'excel', label: 'Excel (.xlsx)', icon: FileText },
  { value: 'csv', label: 'CSV', icon: Database },
  { value: 'json', label: 'JSON', icon: Database }
]

const handleExport = () => {
  const exportData = {
    format: exportFormat.value,
    dateRange: { from: dateFrom.value, to: dateTo.value },
    includePersonalData: includePersonalData.value,
    includeAttendance: includeAttendance.value,
    includeActivities: includeActivities.value,
    includeFamilyRelations: includeFamilyRelations.value
  }
  
  console.log('Exporting data:', exportData)
  // TODO: Implement actual export functionality
}

const handleQuickExport = (type: string) => {
  console.log('Quick export:', type)
  // TODO: Implement quick export
}
</script>

<template>
  <PageLayout
    title="Export"
    breadcrumbs="Dashboard / Rapporter / Export"
  >
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Quick Export Options -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Download class="h-5 w-5" />
            Snabbexport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              class="h-20 flex-col gap-2" 
              @click="handleQuickExport('participants')"
            >
              <FileText class="h-6 w-6" />
              <span>Deltagarlista</span>
            </Button>
            <Button 
              variant="outline" 
              class="h-20 flex-col gap-2" 
              @click="handleQuickExport('activities')"
            >
              <Calendar class="h-6 w-6" />
              <span>Aktiviteter</span>
            </Button>
            <Button 
              variant="outline" 
              class="h-20 flex-col gap-2" 
              @click="handleQuickExport('attendance')"
            >
              <Database class="h-6 w-6" />
              <span>Närvarorapport</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Custom Export -->
      <Card>
        <CardHeader>
          <CardTitle>Anpassad export</CardTitle>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Export Format -->
          <div class="space-y-2">
            <Label>Exportformat</Label>
            <Select v-model="exportFormat">
              <SelectTrigger>
                <SelectValue placeholder="Välj format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="option in exportOptions" 
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Date Range -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="dateFrom">Från datum</Label>
              <Input
                id="dateFrom"
                v-model="dateFrom"
                type="date"
              />
            </div>
            <div class="space-y-2">
              <Label for="dateTo">Till datum</Label>
              <Input
                id="dateTo"
                v-model="dateTo"
                type="date"
              />
            </div>
          </div>

          <!-- Data Selection -->
          <div class="space-y-4">
            <Label class="text-base font-medium">Inkludera data</Label>
            
            <div class="space-y-3">
              <div class="flex items-center space-x-2">
                <Checkbox 
                  id="activities" 
                  v-model:checked="includeActivities"
                />
                <Label for="activities">Aktiviteter</Label>
              </div>
              
              <div class="flex items-center space-x-2">
                <Checkbox 
                  id="attendance" 
                  v-model:checked="includeAttendance"
                />
                <Label for="attendance">Närvaroregistreringar</Label>
              </div>
              
              <div class="flex items-center space-x-2">
                <Checkbox 
                  id="personal" 
                  v-model:checked="includePersonalData"
                />
                <Label for="personal">Personuppgifter (kräver särskild behörighet)</Label>
              </div>
              
              <div class="flex items-center space-x-2">
                <Checkbox 
                  id="family" 
                  v-model:checked="includeFamilyRelations"
                />
                <Label for="family">Familjekopplingar</Label>
              </div>
            </div>
          </div>

          <!-- Export Button -->
          <div class="pt-4">
            <Button
              class="gap-2"
              @click="handleExport"
            >
              <Download class="h-4 w-4" />
              Exportera data
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- GDPR Notice -->
      <Card class="border-yellow-200 bg-yellow-50">
        <CardContent class="pt-6">
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
            <div>
              <h4 class="font-medium text-yellow-800">
                GDPR-information
              </h4>
              <p class="text-sm text-yellow-700 mt-1">
                Export av personuppgifter kräver särskild behörighet och loggas för säkerhetsändamål. 
                Exporterad data ska hanteras enligt gällande dataskyddsförordning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </PageLayout>
</template> 