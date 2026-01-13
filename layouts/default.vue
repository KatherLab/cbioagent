<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-app-bg flex flex-col">
    <header class="bg-white border-b border-app-border sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-14">
          <NuxtLink to="/" class="flex items-center gap-3">
            <img src="https://jnkather.github.io/images/logo.png" class="h-8" alt="Kather Lab" />
            <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h1 class="text-sm font-semibold text-app-text tracking-tight">cBioAgent</h1>
              <p class="text-xs text-app-muted">Cancer genomics explorer</p>
            </div>
          </NuxtLink>
          <nav class="flex items-center gap-4">
            <a
              href="https://www.cbioportal.org"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-app-muted hover:text-app-text flex items-center gap-1"
            >
              cBioPortal
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </nav>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </main>

    <footer class="bg-white border-t border-app-border py-4 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p class="text-xs text-app-muted text-center">
          Data sourced from
          <a
            href="https://www.cbioportal.org"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-600 hover:underline"
          >
            cBioPortal
          </a>
          for Cancer Genomics. This is an independent visualization tool and is not affiliated with cBioPortal.
        </p>
      </div>
    </footer>
  </div>
</template>
