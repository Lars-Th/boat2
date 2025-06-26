<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Färdigställ aktivitet</h1>
            <p v-if="activity" class="text-gray-600 mt-1">{{ activity.Titel }}</p>
          </div>
          <button
            class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            @click="handleCancel"
          >
            Avbryt
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-2">Laddar...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="text-center py-12">
        <div class="text-red-600 mb-4">
          <p class="text-lg font-medium">Ett fel uppstod</p>
          <p class="text-sm">Kunde inte ladda aktivitetsdata</p>
        </div>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          @click="handleRetry"
        >
          Försök igen
        </button>
      </div>

      <!-- Main Content -->
      <div v-else-if="activity && template" class="space-y-8">
        <!-- Activity Info -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Aktivitetsinformation</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Datum:</span>
              <span class="font-medium ml-2">{{ formatDate(activity.Datum) }}</span>
            </div>
            <div>
              <span class="text-gray-600">Tid:</span>
              <span class="font-medium ml-2">{{ activity.Starttid }} - {{ activity.Sluttid }}</span>
            </div>
          </div>
        </div>

        <!-- Completion Form -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">Resultatformulär</h2>

          <!-- Attendance Summary (read-only) -->
          <div class="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 class="text-md font-medium text-gray-900 mb-4">Närvaroöversikt</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Totalt inbjudna:</span>
                <span class="font-medium ml-2">{{ attendanceSummary.totalInvited }}</span>
              </div>
              <div>
                <span class="text-gray-600">Närvarande:</span>
                <span class="font-medium ml-2 text-green-600">{{ attendanceSummary.present }}</span>
              </div>
              <div>
                <span class="text-gray-600">Frånvarande:</span>
                <span class="font-medium ml-2 text-red-600">{{ attendanceSummary.absent }}</span>
              </div>
            </div>
          </div>

          <!-- Staff Information -->
          <div class="mb-8">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Genomförd av
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="completionData.genomfordAv"
              type="text"
              placeholder="Ange vem som genomförde aktiviteten"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Activity Questions -->
          <div class="space-y-6">
            <h3 class="text-md font-medium text-gray-900 border-b pb-2">Utvärderingsfrågor</h3>

            <div v-for="question in template.resultForm" :key="question.id" class="space-y-3">
              <label class="block text-sm font-medium text-gray-700">
                {{ question.question }}
                <span v-if="question.required" class="text-red-500">*</span>
              </label>

              <!-- Scale Question -->
              <div v-if="question.type === 'Skala'" class="space-y-3">
                <div class="flex items-center space-x-4">
                  <span class="text-sm text-gray-500">{{ question.scaleMin }}</span>
                  <div class="flex space-x-3">
                    <label
                      v-for="value in getScaleRange(question.scaleMin, question.scaleMax)"
                      :key="value"
                      class="flex items-center"
                    >
                      <input
                        type="radio"
                        :name="`question-${question.id}`"
                        :value="value"
                        class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                        @change="setAnswerValue(question.id, 'svar', value)"
                      />
                      <span class="text-sm font-medium">{{ value }}</span>
                    </label>
                  </div>
                  <span class="text-sm text-gray-500">{{ question.scaleMax }}</span>
                </div>
                <div v-if="question.scaleComment">
                  <textarea
                    :value="getAnswerValue(question.id, 'kommentar')"
                    placeholder="Kommentar (valfritt)"
                    rows="2"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @input="setAnswerValue(question.id, 'kommentar', $event.target.value)"
                  ></textarea>
                </div>
              </div>

              <!-- Yes/No Question -->
              <div v-else-if="question.type === 'JaNej'" class="space-y-3">
                <div class="flex space-x-6">
                  <label class="flex items-center">
                    <input
                      type="radio"
                      :name="`question-${question.id}`"
                      :value="true"
                      class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      @change="setAnswerValue(question.id, 'svar', true)"
                    />
                    <span class="text-sm font-medium">Ja</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      type="radio"
                      :name="`question-${question.id}`"
                      :value="false"
                      class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      @change="setAnswerValue(question.id, 'svar', false)"
                    />
                    <span class="text-sm font-medium">Nej</span>
                  </label>
                </div>
                <div v-if="question.hasComment">
                  <textarea
                    :value="getAnswerValue(question.id, 'kommentar')"
                    placeholder="Kommentar (valfritt)"
                    rows="2"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @input="setAnswerValue(question.id, 'kommentar', $event.target.value)"
                  ></textarea>
                </div>
              </div>

              <!-- Comment Question -->
              <div v-else-if="question.type === 'Kommentar'">
                <textarea
                  :value="getAnswerValue(question.id, 'svar')"
                  :placeholder="question.required ? 'Obligatorisk kommentar' : 'Valfri kommentar'"
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @input="setAnswerValue(question.id, 'svar', $event.target.value)"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Staff Notes -->
          <div class="mt-8">
            <label class="block text-sm font-medium text-gray-700 mb-2">Personalanteckningar</label>
            <textarea
              v-model="completionData.personalAnteckningar"
              placeholder="Övriga anteckningar från personal (valfritt)"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4">
          <button
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            @click="handleCancel"
          >
            Avbryt
          </button>
          <button
            :disabled="!isFormValid || isSaving"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleSave"
          >
            {{ isSaving ? 'Sparar...' : 'Färdigställ aktivitet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiItem, useApiList } from '@/composables/useApi';
import api from '@/api';

const route = useRoute();
const router = useRouter();
const { success, error } = useToast();

const activityId = route.params.id as string;
const isSaving = ref(false);

// API calls
const {
  data: activity,
  loading: activityLoading,
  error: activityError,
  refresh: refreshActivity,
} = useApiItem(() => api.activities.getById(activityId, { include: ['participants'] }), {
  cacheKey: `activity-${activityId}`,
});

const {
  data: templates,
  loading: templatesLoading,
  error: templatesError,
} = useApiList(() => api.activityTemplates.getAll(), {
  cacheKey: 'activity-templates',
});

// Get attendances for this activity
const {
  data: attendances,
  loading: attendancesLoading,
  error: attendancesError,
} = useApiList(
  () => {
    if (!activityId) return Promise.resolve({ success: true, data: [] });
    return api.attendances.getByActivityId(activityId);
  },
  {
    cacheKey: `attendances-${activityId}`,
  }
);

// Computed properties
const isLoading = computed(() => activityLoading.value || templatesLoading.value);
const hasError = computed(() => activityError.value || templatesError.value);

const template = computed(() => {
  if (!activity.value || !templates.value) return null;
  return templates.value.find(t => t.id === activity.value.template);
});

// Calculate attendance summary from existing attendance data
const attendanceSummary = computed(() => {
  if (!attendances.value) return { totalInvited: 0, present: 0, absent: 0 };

  const presentCount = attendances.value.filter(a => a.Närvaro === true).length;
  const totalCount = attendances.value.length;
  const absentCount = totalCount - presentCount;

  return {
    totalInvited: totalCount,
    present: presentCount,
    absent: absentCount,
  };
});

// Form data
const completionData = ref({
  genomfordAv: '',
  personalAnteckningar: '',
});

// Answers structure: { questionId: { svar: value, kommentar: string } }
const answers = ref<{ [key: number]: { svar: any; kommentar: string } }>({});

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getScaleRange = (min: number, max: number) => {
  const range = [];
  for (let i = min; i <= max; i++) {
    range.push(i);
  }
  return range;
};

const getAnswerValue = (questionId: number, field: 'svar' | 'kommentar') => {
  return answers.value[questionId]?.[field] || '';
};

const setAnswerValue = (questionId: number, field: 'svar' | 'kommentar', value: any) => {
  if (!answers.value[questionId]) {
    answers.value[questionId] = { svar: '', kommentar: '' };
  }
  answers.value[questionId][field] = value;
};

// Form validation
const isFormValid = computed(() => {
  if (!template.value) return false;

  // Check if all required questions are answered
  for (const question of template.value.resultForm) {
    if (question.required) {
      const answer = answers.value[question.id]?.svar;
      if (answer === undefined || answer === '' || answer === null) {
        return false;
      }
    }
  }

  return completionData.value.genomfordAv.trim() !== '';
});

// Event handlers
const handleCancel = () => {
  router.push(`/activities/${activityId}`);
};

const handleRetry = () => {
  refreshActivity();
};

const handleSave = async () => {
  if (!isFormValid.value || !activity.value || !template.value) return;

  isSaving.value = true;

  try {
    // Get present and absent participants from attendances
    const presentParticipants =
      attendances.value?.filter(a => a.Närvaro === true).map(a => a.ParticipantID) || [];
    const absentParticipants =
      attendances.value?.filter(a => a.Närvaro === false).map(a => a.ParticipantID) || [];

    // Prepare completion data
    const completion = {
      aktivitetId: parseInt(activityId),
      genomfordDatum: new Date().toISOString(),
      antalInbjudna: attendanceSummary.value.totalInvited,
      antalNarvarande: attendanceSummary.value.present,
      frånvarande: absentParticipants,
      resultat: [
        {
          deltagarId: null, // Activity-level responses, not participant-specific
          svar: Object.entries(answers.value).map(([questionId, answer]) => ({
            fragaId: parseInt(questionId),
            svar: answer.svar,
            kommentar: answer.kommentar || '',
          })),
        },
      ],
      uppföljningsbehov: [],
      personalAnteckningar: completionData.value.personalAnteckningar,
      genomfordAv: completionData.value.genomfordAv,
    };

    // Save completion
    const completionResult = await api.activityCompletions.create(completion);

    if (completionResult.success) {
      // Update activity status to completed
      const updateResult = await api.activities.update(activityId, { status: true });

      if (updateResult.success) {
        success('Aktiviteten har färdigställts och rapporten har sparats!');
        router.push(`/activities/${activityId}`);
      } else {
        error('Rapporten sparades men aktivitetsstatus kunde inte uppdateras.');
      }
    } else {
      error('Ett fel uppstod när rapporten skulle sparas.');
    }
  } catch (err) {
    console.error('Error saving completion:', err);
    error('Ett oväntat fel uppstod.');
  } finally {
    isSaving.value = false;
  }
};
</script>
