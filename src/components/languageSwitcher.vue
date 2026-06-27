<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()

const languages = computed(() => [
  { title: t('language.english'), value: 'en' },
  { title: t('language.khmer'), value: 'kh' },
])

function changeLocale(value) {
  locale.value = value
  localStorage.setItem('locale', value)
}
</script>

<template>
  <v-select
    :aria-label="t('language.label')"
    class="language-switcher"
    density="compact"
    hide-details
    :items="languages"
    :model-value="locale"
    prepend-inner-icon="mdi-translate"
    variant="solo"
    @update:model-value="changeLocale"
  />
</template>

<style scoped>
.language-switcher {
  max-width: 132px;
}

.language-switcher :deep(.v-field) {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}
</style>
