<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { ChartData } from '~/types/cbioportal'
import type { ChartOptions } from 'chart.js'

const props = defineProps<{
  title: string
  data: ChartData
  color?: string
  horizontal?: boolean
}>()

const chartData = computed(() => ({
  labels: props.data.labels,
  datasets: [
    {
      data: props.data.values,
      backgroundColor: props.color || '#3b82f6',
      borderRadius: 4,
    },
  ],
}))

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: props.horizontal ? 'y' : 'x',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `Count: ${context.raw as number}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: !props.horizontal },
      ticks: { font: { size: 10 } },
    },
    y: {
      grid: { display: !!props.horizontal },
      ticks: { font: { size: 10 } },
      beginAtZero: true,
    },
  },
}))
</script>

<template>
  <div class="card">
    <h3 class="text-sm font-medium text-app-text mb-3">{{ title }}</h3>
    <div class="h-48">
      <ClientOnly>
        <Bar :data="chartData" :options="chartOptions" />
      </ClientOnly>
    </div>
  </div>
</template>
