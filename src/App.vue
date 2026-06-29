<script setup>
import { watchEffect } from 'vue'
import { useTheme } from 'vuetify'
import AppFooter from './components/shop/AppFooter.vue'
import AppHeader from './components/shop/AppHeader.vue'
import { useThemeStore } from './stores/theme'

const vuetifyTheme = useTheme()
const themeStore = useThemeStore()

watchEffect(() => {
  vuetifyTheme.global.name.value = themeStore.name
})
</script>

<template>
  <v-app>
    <AppHeader />
    <v-main class="app-main">
      <RouterView />
    </v-main>
    <AppFooter />
  </v-app>
</template>

<style scoped>
.app-main {
  background: rgb(var(--v-theme-background));
}
</style>
