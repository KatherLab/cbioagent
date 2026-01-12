<script setup lang="ts">
import { Pie } from 'vue-chartjs'
import type { ChartData } from '~/types/cbioportal'
import type { ChartOptions } from 'chart.js'

const props = defineProps<{
  title: string
  data: ChartData
  colors?: string[]
}>()

const defaultColors = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
  '#14b8a6', '#f43f5e', '#a855f7', '#0ea5e9', '#eab308',
]

const chartData = computed(() => ({
  labels: props.data.labels,
  datasets: [
    {
      data: props.data.values,
      backgroundColor: props.colors || defaultColors.slice(0, props.data.labels.length),
      borderWidth: 1,
      borderColor: '#ffffff',
    },
  ],
}))

const chartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        boxWidth: 12,
        padding: 8,
        font: { size: 11 },
      },
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0)
          const value = context.raw as number
          const percentage = ((value / total) * 100).toFixed(1)
          return `${context.label}: ${value} (${percentage}%)`
        },
      },
    },
  },
}
</script>

<template>
  <div class="card">
    <h3 class="text-sm font-medium text-app-text mb-3">{{ title }}</h3>
    <div class="h-48">
      <ClientOnly>
        <Pie :data="chartData" :options="chartOptions" />
      </ClientOnly>
    </div>
  </div>
</template>
