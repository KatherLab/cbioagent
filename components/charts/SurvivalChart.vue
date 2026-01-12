<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { SurvivalData } from '~/types/cbioportal'
import type { ChartOptions } from 'chart.js'

const props = defineProps<{
  title: string
  data: SurvivalData[]
}>()

// Calculate Kaplan-Meier survival curve
function calculateKaplanMeier(data: SurvivalData[]) {
  if (data.length === 0) return { labels: [], values: [] }

  const sorted = [...data].sort((a, b) => a.months - b.months)
  const points: { month: number; survival: number }[] = [{ month: 0, survival: 100 }]

  let atRisk = sorted.length
  let survival = 100

  for (const item of sorted) {
    const isDeceased = item.status.includes('DECEASED') ||
                       item.status === '1:DECEASED' ||
                       item.status === 'DEAD'

    if (isDeceased) {
      survival = survival * ((atRisk - 1) / atRisk)
      points.push({ month: item.months, survival })
    }
    atRisk--
  }

  return {
    labels: points.map((p) => p.month.toFixed(0)),
    values: points.map((p) => p.survival),
  }
}

const survivalCurve = computed(() => calculateKaplanMeier(props.data))

const chartData = computed(() => ({
  labels: survivalCurve.value.labels,
  datasets: [
    {
      label: 'Overall Survival',
      data: survivalCurve.value.values,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0,
      stepped: 'after' as const,
      pointRadius: 0,
      borderWidth: 2,
    },
  ],
}))

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `Survival: ${(context.raw as number).toFixed(1)}%`,
        title: (items) => `Month ${items[0].label}`,
      },
    },
  },
  scales: {
    x: {
      title: { display: true, text: 'Months', font: { size: 11 } },
      ticks: { font: { size: 10 } },
    },
    y: {
      title: { display: true, text: 'Survival (%)', font: { size: 11 } },
      ticks: { font: { size: 10 } },
      min: 0,
      max: 100,
    },
  },
}

const medianSurvival = computed(() => {
  const curve = survivalCurve.value
  for (let i = 0; i < curve.values.length; i++) {
    if (curve.values[i] <= 50) {
      return curve.labels[i]
    }
  }
  return 'Not reached'
})
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-medium text-app-text">{{ title }}</h3>
      <span class="text-xs text-app-muted">
        Median: {{ medianSurvival }} {{ typeof medianSurvival === 'number' ? 'months' : '' }}
      </span>
    </div>
    <div class="h-48">
      <ClientOnly>
        <Line :data="chartData" :options="chartOptions" />
      </ClientOnly>
    </div>
    <p class="text-xs text-app-muted mt-2">
      Based on {{ data.length }} patients with survival data
    </p>
  </div>
</template>
