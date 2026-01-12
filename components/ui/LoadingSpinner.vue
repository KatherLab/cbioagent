<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
  text?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2">
    <div
      class="animate-spin rounded-full border-2 border-app-border border-t-primary-600"
      :class="{
        'h-4 w-4': size === 'sm',
        'h-6 w-6': size === 'md' || !size,
        'h-8 w-8': size === 'lg',
      }"
    />
    <span v-if="text" class="text-sm text-app-muted">{{ text }}</span>
  </div>
</template>
