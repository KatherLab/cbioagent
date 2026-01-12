<script setup lang="ts">
import type { Gene } from '~/types/cbioportal'

const emit = defineEmits<{
  select: [gene: Gene]
}>()

const { searchGenes } = useCBioPortal()

const searchQuery = ref('')
const results = ref<Gene[]>([])
const isSearching = ref(false)
const showDropdown = ref(false)
const selectedIndex = ref(-1)

// Popular cancer genes for quick access
const popularGenes: Gene[] = [
  { entrezGeneId: 7157, hugoGeneSymbol: 'TP53', type: 'protein-coding' },
  { entrezGeneId: 672, hugoGeneSymbol: 'BRCA1', type: 'protein-coding' },
  { entrezGeneId: 675, hugoGeneSymbol: 'BRCA2', type: 'protein-coding' },
  { entrezGeneId: 3845, hugoGeneSymbol: 'KRAS', type: 'protein-coding' },
  { entrezGeneId: 1956, hugoGeneSymbol: 'EGFR', type: 'protein-coding' },
  { entrezGeneId: 5290, hugoGeneSymbol: 'PIK3CA', type: 'protein-coding' },
  { entrezGeneId: 207, hugoGeneSymbol: 'AKT1', type: 'protein-coding' },
  { entrezGeneId: 4893, hugoGeneSymbol: 'NRAS', type: 'protein-coding' },
  { entrezGeneId: 673, hugoGeneSymbol: 'BRAF', type: 'protein-coding' },
  { entrezGeneId: 5728, hugoGeneSymbol: 'PTEN', type: 'protein-coding' },
  { entrezGeneId: 4609, hugoGeneSymbol: 'MYC', type: 'protein-coding' },
  { entrezGeneId: 238, hugoGeneSymbol: 'ALK', type: 'protein-coding' },
]

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null

async function handleInput() {
  const query = searchQuery.value.trim()

  if (query.length < 2) {
    results.value = []
    showDropdown.value = false
    return
  }

  // Debounce
  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(async () => {
    isSearching.value = true
    try {
      results.value = await searchGenes(query)
      showDropdown.value = results.value.length > 0
      selectedIndex.value = -1
    } finally {
      isSearching.value = false
    }
  }, 300)
}

function selectGene(gene: Gene) {
  searchQuery.value = gene.hugoGeneSymbol
  showDropdown.value = false
  emit('select', gene)
}

function quickSelectGene(gene: Gene) {
  searchQuery.value = gene.hugoGeneSymbol
  results.value = []
  showDropdown.value = false
  emit('select', gene)
}

function handleKeydown(e: KeyboardEvent) {
  if (!showDropdown.value) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && selectedIndex.value >= 0) {
    e.preventDefault()
    selectGene(results.value[selectedIndex.value])
  } else if (e.key === 'Escape') {
    showDropdown.value = false
  }
}

function handleBlur() {
  // Delay to allow click on dropdown item
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}
</script>

<template>
  <div class="relative">
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search genes (e.g., TP53, BRCA1, KRAS)..."
        class="input w-full pr-10"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="showDropdown = results.length > 0"
        @blur="handleBlur"
      />
      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
        <svg v-if="isSearching" class="w-4 h-4 text-app-muted animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <svg v-else class="w-4 h-4 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- Dropdown Results -->
    <div
      v-if="showDropdown"
      class="absolute z-10 w-full mt-1 bg-white border border-app-border rounded-lg shadow-lg max-h-64 overflow-auto"
    >
      <button
        v-for="(gene, index) in results"
        :key="gene.entrezGeneId"
        class="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
        :class="{ 'bg-primary-50': index === selectedIndex }"
        @click="selectGene(gene)"
      >
        <div>
          <span class="font-medium text-app-text">{{ gene.hugoGeneSymbol }}</span>
          <span class="ml-2 text-xs text-app-muted">Entrez: {{ gene.entrezGeneId }}</span>
        </div>
        <span class="text-xs px-2 py-0.5 bg-gray-100 rounded text-app-muted">
          {{ gene.type }}
        </span>
      </button>
    </div>

    <!-- Quick Search Buttons -->
    <div class="mt-3">
      <div class="text-xs text-app-muted mb-2">Popular genes:</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="gene in popularGenes"
          :key="gene.entrezGeneId"
          class="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-primary-100 hover:text-primary-700 text-app-text rounded-full transition-colors"
          :class="{ 'bg-primary-100 text-primary-700': searchQuery === gene.hugoGeneSymbol }"
          @click="quickSelectGene(gene)"
        >
          {{ gene.hugoGeneSymbol }}
        </button>
      </div>
    </div>
  </div>
</template>
