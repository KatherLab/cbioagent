<script setup lang="ts">
import type { MutationSummary } from '~/types/cbioportal'

defineProps<{
  summary: MutationSummary
  studyId: string
}>()
</script>

<template>
  <div class="space-y-6">
    <!-- Summary Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="card bg-gray-50">
        <div class="text-2xl font-bold text-app-text">{{ summary.gene.hugoGeneSymbol }}</div>
        <div class="text-xs text-app-muted">Gene Symbol</div>
      </div>
      <div class="card bg-gray-50">
        <div class="text-2xl font-bold text-app-text">{{ summary.totalMutations }}</div>
        <div class="text-xs text-app-muted">Total Mutations</div>
      </div>
      <div class="card bg-gray-50">
        <div class="text-2xl font-bold text-app-text">{{ summary.uniqueSamples }}</div>
        <div class="text-xs text-app-muted">Mutated Samples</div>
      </div>
      <div class="card bg-gray-50">
        <div class="text-2xl font-bold text-primary-600">{{ summary.mutationRate.toFixed(1) }}%</div>
        <div class="text-xs text-app-muted">Mutation Rate</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Mutation Types Chart -->
      <ChartsPieChart
        v-if="summary.mutationTypes.labels.length > 0"
        title="Mutation Types"
        :data="summary.mutationTypes"
      />

      <!-- Top Protein Changes -->
      <div class="card" v-if="summary.topProteinChanges.length > 0">
        <h3 class="text-sm font-medium text-app-text mb-3">Top Protein Changes</h3>
        <div class="space-y-2">
          <div
            v-for="item in summary.topProteinChanges"
            :key="item.change"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <span class="font-mono text-sm text-app-text">{{ summary.gene.hugoGeneSymbol }} {{ item.change }}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary-500 rounded-full"
                  :style="{ width: `${(item.count / summary.totalMutations) * 100}%` }"
                />
              </div>
              <span class="text-xs text-app-muted w-8 text-right">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- External Link -->
    <div class="flex justify-end">
      <a
        :href="`https://www.cbioportal.org/results/mutations?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=${studyId}_mutations&cancer_study_list=${studyId}&gene_list=${summary.gene.hugoGeneSymbol}`"
        target="_blank"
        rel="noopener"
        class="btn-secondary text-sm flex items-center gap-1.5"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        View {{ summary.gene.hugoGeneSymbol }} on cBioPortal
      </a>
    </div>
  </div>
</template>
