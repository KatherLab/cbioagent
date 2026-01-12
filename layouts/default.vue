<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-app-bg">
    <header class="bg-white border-b border-app-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-14">
          <div class="flex items-center gap-2">
            <h1 class="text-lg font-semibold text-app-text">cbioagent</h1>
          </div>
          <nav class="flex items-center gap-4">
            <NuxtLink to="/" class="text-sm text-app-muted hover:text-app-text">
              Home
            </NuxtLink>
          </nav>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </main>
  </div>
</template>
