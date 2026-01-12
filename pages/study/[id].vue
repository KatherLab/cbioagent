<script setup lang="ts">
import { useStudyStore } from '~/stores/study'
import type { ChartData, SurvivalData } from '~/types/cbioportal'

const route = useRoute()
const studyStore = useStudyStore()
const { calculateDistribution, calculateAgeHistogram, extractSurvivalData } = useCBioPortal()

const studyId = computed(() => route.params.id as string)

// Load study data on mount
onMounted(async () => {
  await studyStore.loadStudyData(studyId.value)
})

// Watch for route changes
watch(studyId, async (newId) => {
  await studyStore.loadStudyData(newId)
})

// Computed chart data
const genderDistribution = computed<ChartData>(() => {
  if (studyStore.patients.length === 0) return { labels: [], values: [] }
  return calculateDistribution(studyStore.patients, 'SEX')
})

const ageDistribution = computed<ChartData>(() => {
  if (studyStore.patients.length === 0) return { labels: [], values: [] }
  return calculateAgeHistogram(studyStore.patients)
})

const stageDistribution = computed<ChartData>(() => {
  if (studyStore.patients.length === 0) return { labels: [], values: [] }
  const dist = calculateDistribution(studyStore.patients, 'AJCC_PATHOLOGIC_TUMOR_STAGE')
  // Limit to top 10 stages
  return {
    labels: dist.labels.slice(0, 10),
    values: dist.values.slice(0, 10),
  }
})

const raceDistribution = computed<ChartData>(() => {
  if (studyStore.patients.length === 0) return { labels: [], values: [] }
  return calculateDistribution(studyStore.patients, 'RACE')
})

const survivalStatusDistribution = computed<ChartData>(() => {
  if (studyStore.patients.length === 0) return { labels: [], values: [] }
  return calculateDistribution(studyStore.patients, 'OS_STATUS')
})

const survivalData = computed<SurvivalData[]>(() => {
  if (studyStore.patients.length === 0) return []
  return extractSurvivalData(studyStore.patients)
})

// Check data availability
const hasGenderData = computed(() => genderDistribution.value.labels.length > 0)
const hasAgeData = computed(() => ageDistribution.value.values.some(v => v > 0))
const hasStageData = computed(() => stageDistribution.value.labels.length > 0)
const hasRaceData = computed(() => raceDistribution.value.labels.length > 0)
const hasSurvivalData = computed(() => survivalData.value.length > 0)
</script>

<template>
  <div>
    <!-- Back Button -->
    <NuxtLink
      to="/"
      class="inline-flex items-center gap-1 text-sm text-app-muted hover:text-app-text mb-4"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Back to Studies
    </NuxtLink>

    <!-- Loading State -->
    <div v-if="studyStore.isLoadingStudyData" class="py-12">
      <UiLoadingSpinner size="lg" text="Loading study data..." />
    </div>

    <!-- Error State -->
    <UiErrorAlert
      v-else-if="studyStore.error"
      :message="studyStore.error"
      @retry="studyStore.loadStudyData(studyId)"
    />

    <!-- Study Not Found -->
    <div v-else-if="!studyStore.currentStudy" class="card text-center py-8">
      <h3 class="font-medium text-app-text">Study not found</h3>
      <p class="text-sm text-app-muted mt-1">
        The requested study could not be loaded.
      </p>
    </div>

    <!-- Study Dashboard -->
    <template v-else>
      <!-- Study Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-app-text">
          {{ studyStore.currentStudy.name }}
        </h1>
        <p class="text-app-muted mt-1 max-w-4xl">
          {{ studyStore.currentStudy.description }}
        </p>
        <div class="flex items-center gap-4 mt-3 text-sm text-app-muted">
          <span v-if="studyStore.currentStudy.citation" class="text-primary-600">
            {{ studyStore.currentStudy.citation }}
          </span>
          <span v-if="studyStore.currentStudy.pmid">
            PMID: {{ studyStore.currentStudy.pmid }}
          </span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <UiStatCard
          label="Patients"
          :value="studyStore.patientCount"
          icon="👥"
        />
        <UiStatCard
          label="Samples"
          :value="studyStore.currentStudy.allSampleCount"
          icon="🧬"
        />
        <UiStatCard
          label="Molecular Profiles"
          :value="studyStore.molecularProfiles.length"
          icon="📊"
        />
        <UiStatCard
          label="Clinical Attributes"
          :value="studyStore.clinicalAttributes.length"
          icon="📋"
        />
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <!-- Gender Distribution -->
        <ChartsPieChart
          v-if="hasGenderData"
          title="Sex Distribution"
          :data="genderDistribution"
        />

        <!-- Age Distribution -->
        <ChartsBarChart
          v-if="hasAgeData"
          title="Age at Diagnosis"
          :data="ageDistribution"
          color="#3b82f6"
        />

        <!-- Race Distribution -->
        <ChartsPieChart
          v-if="hasRaceData"
          title="Race Distribution"
          :data="raceDistribution"
        />

        <!-- Tumor Stage Distribution -->
        <ChartsBarChart
          v-if="hasStageData"
          title="Tumor Stage (AJCC)"
          :data="stageDistribution"
          color="#8b5cf6"
          :horizontal="true"
        />

        <!-- Survival Status -->
        <ChartsPieChart
          v-if="survivalStatusDistribution.labels.length > 0"
          title="Overall Survival Status"
          :data="survivalStatusDistribution"
          :colors="['#22c55e', '#ef4444']"
        />
      </div>

      <!-- Survival Curve (full width) -->
      <div v-if="hasSurvivalData" class="mb-6">
        <ChartsSurvivalChart
          title="Kaplan-Meier Overall Survival Curve"
          :data="survivalData"
        />
      </div>

      <!-- Molecular Profiles Section -->
      <div v-if="studyStore.molecularProfiles.length > 0" class="card mb-6">
        <h3 class="text-sm font-medium text-app-text mb-3">
          Available Molecular Profiles
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div
            v-for="profile in studyStore.molecularProfiles"
            :key="profile.molecularProfileId"
            class="p-2 bg-gray-50 rounded-lg"
          >
            <p class="text-sm font-medium text-app-text truncate">
              {{ profile.name }}
            </p>
            <p class="text-xs text-app-muted">
              {{ profile.molecularAlterationType }}
            </p>
          </div>
        </div>
      </div>

      <!-- Clinical Attributes Section -->
      <div class="card">
        <h3 class="text-sm font-medium text-app-text mb-3">
          Clinical Attributes ({{ studyStore.clinicalAttributes.length }})
        </h3>
        <div class="max-h-64 overflow-y-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <div
              v-for="attr in studyStore.patientAttributes.slice(0, 30)"
              :key="attr.clinicalAttributeId"
              class="p-2 bg-gray-50 rounded text-xs"
            >
              <span class="font-medium text-app-text">{{ attr.displayName }}</span>
              <span class="text-app-muted ml-1">({{ attr.datatype }})</span>
            </div>
          </div>
        </div>
        <p
          v-if="studyStore.patientAttributes.length > 30"
          class="text-xs text-app-muted mt-2"
        >
          And {{ studyStore.patientAttributes.length - 30 }} more attributes...
        </p>
      </div>
    </template>
  </div>
</template>
