<script setup lang="ts">
import { useStudyStore } from '~/stores/study'
import type { ChartData, SurvivalData, Gene, MutationSummary } from '~/types/cbioportal'

const route = useRoute()
const studyStore = useStudyStore()
const { calculateDistribution, calculateAgeHistogram, extractSurvivalData, fetchGeneMutations, summarizeMutations } = useCBioPortal()

const studyId = computed(() => route.params.id as string)
const activeTab = ref<'overview' | 'clinical' | 'molecular' | 'mutations'>('overview')

// Mutation search state
const selectedGene = ref<Gene | null>(null)
const mutationSummary = ref<MutationSummary | null>(null)
const isLoadingMutations = ref(false)
const mutationError = ref<string | null>(null)

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
  return {
    labels: dist.labels.slice(0, 10),
    values: dist.values.slice(0, 10),
  }
})

const raceDistribution = computed<ChartData>(() => {
  if (studyStore.patients.length === 0) return { labels: [], values: [] }
  return calculateDistribution(studyStore.patients, 'RACE')
})

const ethnicityDistribution = computed<ChartData>(() => {
  if (studyStore.patients.length === 0) return { labels: [], values: [] }
  return calculateDistribution(studyStore.patients, 'ETHNICITY')
})

const cancerTypeDistribution = computed<ChartData>(() => {
  if (studyStore.patients.length === 0) return { labels: [], values: [] }
  const dist = calculateDistribution(studyStore.patients, 'CANCER_TYPE_DETAILED')
  if (dist.labels.length === 0) {
    return calculateDistribution(studyStore.patients, 'SUBTYPE')
  }
  return {
    labels: dist.labels.slice(0, 12),
    values: dist.values.slice(0, 12),
  }
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
const hasEthnicityData = computed(() => ethnicityDistribution.value.labels.length > 0)
const hasCancerTypeData = computed(() => cancerTypeDistribution.value.labels.length > 0)
const hasSurvivalData = computed(() => survivalData.value.length > 0)

// Export to CSV
function exportToCSV() {
  if (studyStore.patients.length === 0) return

  // Get all unique attribute keys
  const allKeys = new Set<string>()
  for (const patient of studyStore.patients) {
    Object.keys(patient).forEach(key => allKeys.add(key))
  }
  const headers = Array.from(allKeys)

  // Build CSV content
  const rows = studyStore.patients.map(patient => {
    return headers.map(header => {
      const value = patient[header]
      if (value === undefined || value === null) return ''
      const strValue = String(value)
      // Escape quotes and wrap in quotes if contains comma
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`
      }
      return strValue
    }).join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${studyId.value}_clinical_data.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

// Copy study ID
function copyStudyId() {
  navigator.clipboard.writeText(studyId.value)
}

// Find mutation profile for the study
const mutationProfile = computed(() => {
  return studyStore.molecularProfiles.find(
    p => p.molecularAlterationType === 'MUTATION_EXTENDED'
  )
})

// Handle gene selection
async function handleGeneSelect(gene: Gene) {
  if (!mutationProfile.value) {
    mutationError.value = 'No mutation profile available for this study'
    return
  }

  selectedGene.value = gene
  mutationSummary.value = null
  mutationError.value = null
  isLoadingMutations.value = true

  try {
    const mutations = await fetchGeneMutations(
      studyId.value,
      gene.entrezGeneId,
      mutationProfile.value.molecularProfileId
    )

    if (mutations.length === 0) {
      mutationError.value = `No mutations found for ${gene.hugoGeneSymbol} in this study`
      return
    }

    mutationSummary.value = summarizeMutations(
      mutations,
      gene,
      studyStore.sampleCount
    )
  } catch (e) {
    console.error('Failed to fetch mutations:', e)
    mutationError.value = 'Failed to fetch mutation data'
  } finally {
    isLoadingMutations.value = false
  }
}
</script>

<template>
  <div>
    <!-- Back Button -->
    <NuxtLink
      to="/"
      class="inline-flex items-center gap-1 text-sm text-app-muted hover:text-app-text mb-4"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
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
      <p class="text-sm text-app-muted mt-1">The requested study could not be loaded.</p>
    </div>

    <!-- Study Dashboard -->
    <template v-else>
      <!-- Study Header -->
      <div class="card mb-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div class="flex-1">
            <h1 class="text-2xl font-semibold text-app-text">
              {{ studyStore.currentStudy.name }}
            </h1>
            <p
              class="text-app-muted mt-2 [&_a]:text-primary-600 [&_a]:hover:underline"
              v-html="studyStore.currentStudy.description"
            />
            <div class="flex flex-wrap items-center gap-3 mt-3 text-sm">
              <button
                @click="copyStudyId"
                class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-app-muted text-xs font-mono"
                title="Click to copy"
              >
                {{ studyId }}
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <a
                v-if="studyStore.currentStudy.pmid"
                :href="`https://pubmed.ncbi.nlm.nih.gov/${studyStore.currentStudy.pmid}`"
                target="_blank"
                rel="noopener"
                class="text-primary-600 hover:underline"
              >
                PMID: {{ studyStore.currentStudy.pmid }}
              </a>
              <span v-if="studyStore.currentStudy.citation" class="text-app-muted">
                {{ studyStore.currentStudy.citation }}
              </span>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="exportToCSV"
              class="btn-secondary flex items-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <a
              :href="`https://www.cbioportal.org/study/summary?id=${studyId}`"
              target="_blank"
              rel="noopener"
              class="btn-secondary flex items-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              cBioPortal
            </a>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <UiStatCard label="Patients" :value="studyStore.patientCount" icon="👥" />
        <UiStatCard label="Samples" :value="studyStore.sampleCount" icon="🧬" />
        <UiStatCard label="Molecular Profiles" :value="studyStore.molecularProfiles.length" icon="📊" />
        <UiStatCard label="Clinical Attributes" :value="studyStore.clinicalAttributes.length" icon="📋" />
      </div>

      <!-- Tabs -->
      <div class="border-b border-app-border mb-6">
        <nav class="flex gap-6">
          <button
            v-for="tab in [
              { id: 'overview', label: 'Overview' },
              { id: 'clinical', label: 'Clinical Data' },
              { id: 'molecular', label: 'Molecular Profiles' },
              { id: 'mutations', label: 'Gene Mutations' },
            ]"
            :key="tab.id"
            @click="activeTab = tab.id as typeof activeTab"
            class="pb-3 text-sm font-medium border-b-2 -mb-px transition-colors"
            :class="activeTab === tab.id
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-app-muted hover:text-app-text'"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'">
        <!-- Demographics Charts -->
        <h2 class="text-lg font-medium text-app-text mb-4">Demographics</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <ChartsPieChart v-if="hasGenderData" title="Sex Distribution" :data="genderDistribution" />
          <ChartsBarChart v-if="hasAgeData" title="Age at Diagnosis" :data="ageDistribution" color="#3b82f6" />
          <ChartsPieChart v-if="hasRaceData" title="Race Distribution" :data="raceDistribution" />
          <ChartsPieChart v-if="hasEthnicityData" title="Ethnicity Distribution" :data="ethnicityDistribution" />
          <ChartsPieChart
            v-if="hasCancerTypeData"
            title="Cancer Subtype"
            :data="cancerTypeDistribution"
          />
          <ChartsBarChart
            v-if="hasStageData"
            title="Tumor Stage (AJCC)"
            :data="stageDistribution"
            color="#8b5cf6"
            :horizontal="true"
          />
        </div>

        <!-- Survival Section -->
        <template v-if="hasSurvivalData">
          <h2 class="text-lg font-medium text-app-text mb-4">Survival Analysis</h2>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div class="lg:col-span-2">
              <ChartsSurvivalChart title="Kaplan-Meier Overall Survival" :data="survivalData" />
            </div>
            <ChartsPieChart
              v-if="survivalStatusDistribution.labels.length > 0"
              title="Survival Status"
              :data="survivalStatusDistribution"
              :colors="['#22c55e', '#ef4444']"
            />
          </div>
        </template>
      </div>

      <!-- Clinical Data Tab -->
      <div v-if="activeTab === 'clinical'">
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-medium text-app-text">
              Clinical Attributes ({{ studyStore.clinicalAttributes.length }})
            </h3>
            <span class="text-xs text-app-muted">
              {{ studyStore.patientAttributes.length }} patient attributes,
              {{ studyStore.sampleAttributes.length }} sample attributes
            </span>
          </div>

          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-medium text-app-muted mb-2">Patient Attributes</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div
                  v-for="attr in studyStore.patientAttributes"
                  :key="attr.clinicalAttributeId"
                  class="p-2 bg-gray-50 rounded text-xs group hover:bg-gray-100"
                >
                  <div class="font-medium text-app-text">{{ attr.displayName }}</div>
                  <div class="text-app-muted flex items-center justify-between">
                    <span class="font-mono">{{ attr.clinicalAttributeId }}</span>
                    <span class="px-1.5 py-0.5 bg-white rounded text-[10px]">{{ attr.datatype }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="studyStore.sampleAttributes.length > 0">
              <h4 class="text-sm font-medium text-app-muted mb-2">Sample Attributes</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div
                  v-for="attr in studyStore.sampleAttributes"
                  :key="attr.clinicalAttributeId"
                  class="p-2 bg-gray-50 rounded text-xs group hover:bg-gray-100"
                >
                  <div class="font-medium text-app-text">{{ attr.displayName }}</div>
                  <div class="text-app-muted flex items-center justify-between">
                    <span class="font-mono">{{ attr.clinicalAttributeId }}</span>
                    <span class="px-1.5 py-0.5 bg-white rounded text-[10px]">{{ attr.datatype }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Molecular Profiles Tab -->
      <div v-if="activeTab === 'molecular'">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="profile in studyStore.molecularProfiles"
            :key="profile.molecularProfileId"
            class="card"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="font-medium text-app-text">{{ profile.name }}</h3>
                <p class="text-sm text-app-muted mt-1">{{ profile.description }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <span class="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                    {{ profile.molecularAlterationType }}
                  </span>
                  <span class="px-2 py-0.5 bg-gray-100 text-app-muted rounded text-xs">
                    {{ profile.datatype }}
                  </span>
                </div>
              </div>
              <a
                :href="`https://www.cbioportal.org/results/oncoprint?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=${profile.molecularProfileId}&cancer_study_list=${studyId}`"
                target="_blank"
                rel="noopener"
                class="text-primary-600 hover:text-primary-700"
                title="View on cBioPortal"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div v-if="studyStore.molecularProfiles.length === 0" class="card text-center py-8">
          <p class="text-app-muted">No molecular profiles available for this study.</p>
        </div>
      </div>

      <!-- Gene Mutations Tab -->
      <div v-if="activeTab === 'mutations'">
        <div class="card mb-6">
          <h3 class="font-medium text-app-text mb-3">Search Gene Mutations</h3>
          <p class="text-sm text-app-muted mb-4">
            Search for a gene to view mutation frequency and types in this study.
          </p>
          <GeneSearch @select="handleGeneSelect" />
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingMutations" class="py-8">
          <UiLoadingSpinner size="md" text="Loading mutation data..." />
        </div>

        <!-- Error State -->
        <div v-else-if="mutationError" class="card bg-amber-50 border-amber-200">
          <div class="flex items-center gap-2 text-amber-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="text-sm">{{ mutationError }}</span>
          </div>
        </div>

        <!-- Mutation Results -->
        <MutationResults
          v-else-if="mutationSummary"
          :summary="mutationSummary"
          :study-id="studyId"
        />

        <!-- Empty State -->
        <div v-else-if="!selectedGene" class="card text-center py-12">
          <svg class="w-12 h-12 text-app-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 class="font-medium text-app-text">Search for a gene</h3>
          <p class="text-sm text-app-muted mt-1">
            Enter a gene symbol (e.g., TP53, BRCA1, KRAS) to view mutation data
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
