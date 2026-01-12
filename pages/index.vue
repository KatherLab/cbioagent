<script setup lang="ts">
import { useStudyStore } from '~/stores/study'

const studyStore = useStudyStore()
const searchQuery = ref('')
const selectedFilter = ref<'all' | 'pancan' | 'tcga' | 'other'>('pancan')

// Load studies on mount
onMounted(() => {
  studyStore.loadStudies()
})

const filteredStudies = computed(() => {
  let studies = studyStore.studies

  // Apply category filter
  switch (selectedFilter.value) {
    case 'pancan':
      studies = studyStore.tcgaPanCanStudies
      break
    case 'tcga':
      studies = studyStore.tcgaStudies
      break
    case 'other':
      studies = studyStore.otherStudies
      break
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    studies = studies.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.studyId.toLowerCase().includes(query) ||
        s.cancerTypeId.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
    )
  }

  return studies
})

const filterOptions = [
  { value: 'pancan', label: 'TCGA PanCancer Atlas', count: computed(() => studyStore.tcgaPanCanStudies.length) },
  { value: 'tcga', label: 'All TCGA Studies', count: computed(() => studyStore.tcgaStudies.length) },
  { value: 'other', label: 'Other Studies', count: computed(() => studyStore.otherStudies.length) },
  { value: 'all', label: 'All Studies', count: computed(() => studyStore.studies.length) },
]
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-app-text">Cancer Genomics Explorer</h1>
      <p class="text-app-muted mt-1">
        Browse and visualize cancer genomics cohorts from cBioPortal
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="studyStore.isLoadingStudies" class="py-12">
      <UiLoadingSpinner size="lg" text="Loading studies from cBioPortal..." />
    </div>

    <!-- Error State -->
    <UiErrorAlert
      v-else-if="studyStore.error"
      :message="studyStore.error"
      @retry="studyStore.loadStudies()"
    />

    <!-- Content -->
    <template v-else>
      <!-- Search and Filters -->
      <div class="card mb-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1">
            <label class="label">Search Studies</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, cancer type, or study ID..."
              class="input"
            />
          </div>

          <!-- Category Filter -->
          <div class="sm:w-64">
            <label class="label">Category</label>
            <select v-model="selectedFilter" class="input">
              <option
                v-for="option in filterOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }} ({{ option.count.value }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Results Count -->
      <p class="text-sm text-app-muted mb-3">
        Showing {{ filteredStudies.length }} studies
      </p>

      <!-- Empty State -->
      <div v-if="filteredStudies.length === 0" class="card text-center py-8">
        <svg
          class="w-12 h-12 text-app-muted mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="font-medium text-app-text">No studies found</h3>
        <p class="text-sm text-app-muted mt-1">
          Try adjusting your search or filter criteria
        </p>
      </div>

      <!-- Study List -->
      <div v-else class="space-y-3">
        <StudyCard
          v-for="study in filteredStudies"
          :key="study.studyId"
          :study="study"
        />
      </div>
    </template>
  </div>
</template>
