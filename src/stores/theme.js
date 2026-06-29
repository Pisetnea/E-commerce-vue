import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'shop_theme'

export const useThemeStore = defineStore('theme', () => {
  const savedTheme = localStorage.getItem(STORAGE_KEY)
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const name = ref(savedTheme || (prefersDark ? 'dark' : 'light'))

  const isDark = computed(() => name.value === 'dark')
  const icon = computed(() => (isDark.value ? 'mdi-weather-night' : 'mdi-white-balance-sunny'))

  function setTheme(nextTheme) {
    name.value = nextTheme === 'dark' ? 'dark' : 'light'
    localStorage.setItem(STORAGE_KEY, name.value)
    document.documentElement.dataset.theme = name.value
  }

  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  setTheme(name.value)

  return {
    name,
    isDark,
    icon,
    setTheme,
    toggleTheme,
  }
})
