<script setup>
import AppFooter from './components/shop/AppFooter.vue'
import AppHeader from './components/shop/AppHeader.vue'
</script>

<template>
  <v-app>
    <AppHeader />
    <v-main class="bg-grey-lighten-5">
      <RouterView />
    </v-main>
    <AppFooter />
  </v-app>
</template>
