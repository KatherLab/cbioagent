<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon?: string
}>()
</script>

<template>
  <div class="card">
    <div class="flex items-center gap-3">
      <div
        v-if="icon"
        class="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"
      >
        <span class="text-lg">{{ icon }}</span>
      </div>
      <div>
        <p class="text-2xl font-semibold text-app-text">{{ value }}</p>
        <p class="text-sm text-app-muted">{{ label }}</p>
      </div>
    </div>
  </div>
</template>
