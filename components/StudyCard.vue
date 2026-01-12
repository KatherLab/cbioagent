<script setup lang="ts">
import type { Study } from '~/types/cbioportal'

defineProps<{
  study: Study
}>()

function getCancerTypeLabel(cancerTypeId: string): string {
  const labels: Record<string, string> = {
    brca: 'Breast Cancer',
    luad: 'Lung Adenocarcinoma',
    lusc: 'Lung Squamous Cell',
    coadread: 'Colorectal Cancer',
    ov: 'Ovarian Cancer',
    gbm: 'Glioblastoma',
    lgg: 'Low Grade Glioma',
    hnsc: 'Head & Neck Cancer',
    kirc: 'Kidney Clear Cell',
    kirp: 'Kidney Papillary',
    kich: 'Kidney Chromophobe',
    prad: 'Prostate Cancer',
    stad: 'Stomach Cancer',
    blca: 'Bladder Cancer',
    lihc: 'Liver Cancer',
    thca: 'Thyroid Cancer',
    skcm: 'Melanoma',
    paad: 'Pancreatic Cancer',
    ucec: 'Uterine Cancer',
    cesc: 'Cervical Cancer',
    sarc: 'Sarcoma',
    pcpg: 'Pheochromocytoma',
    acc: 'Adrenocortical Cancer',
    meso: 'Mesothelioma',
    ucs: 'Uterine Carcinosarcoma',
    chol: 'Cholangiocarcinoma',
    thym: 'Thymoma',
    tgct: 'Testicular Cancer',
    uvm: 'Uveal Melanoma',
    dlbc: 'Diffuse Large B-Cell',
    laml: 'Acute Myeloid Leukemia',
    mixed: 'Mixed Cancer Types',
  }
  return labels[cancerTypeId] || cancerTypeId.toUpperCase()
}

function isPanCanAtlas(studyId: string): boolean {
  return studyId.includes('pan_can_atlas')
}
</script>

<template>
  <NuxtLink
    :to="`/study/${study.studyId}`"
    class="card hover:shadow-md hover:border-primary-300 transition-all cursor-pointer block"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="font-medium text-app-text truncate">{{ study.name }}</h3>
          <span
            v-if="isPanCanAtlas(study.studyId)"
            class="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded"
          >
            PanCancer Atlas
          </span>
        </div>
        <p class="text-sm text-app-muted line-clamp-2 mb-2">
          {{ study.description }}
        </p>
        <div class="flex items-center gap-4 text-xs text-app-muted">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {{ study.allSampleCount }} samples
          </span>
          <span class="px-1.5 py-0.5 bg-gray-100 rounded">
            {{ getCancerTypeLabel(study.cancerTypeId) }}
          </span>
          <span v-if="study.citation" class="text-primary-600">
            {{ study.citation }}
          </span>
        </div>
      </div>
      <svg
        class="w-5 h-5 text-app-muted flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  </NuxtLink>
</template>
