// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  runtimeConfig: {
    // Server-only config
    apiSecret: process.env.API_SECRET || 'dev-secret-change-in-production',

    // Public config (exposed to client)
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
  },

  pinia: {
    storesDirs: ['./stores/**'],
  },

  nitro: {
    routeRules: {
      '/api/**': { cors: false },
    },
  },
})
