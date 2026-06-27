<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <footer class="border-t border-slate-200/70 bg-slate-950 text-white">
    <div class="mx-auto grid max-w-[1480px] gap-8 px-6 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
      <div>
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-orange-400 shadow-lg shadow-teal-950/30">
            <v-icon icon="mdi-shopping-outline" />
          </div>
          <strong class="text-xl font-black">Ecommercer</strong>
        </div>
        <p class="max-w-md text-sm leading-6 text-slate-300">
          {{ t('footer.description') }}
        </p>
      </div>

      <div>
        <h3 class="mb-4 text-sm font-bold uppercase tracking-wider text-teal-300">{{ t('footer.shop') }}</h3>
        <div class="grid gap-2 text-sm text-slate-300">
          <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
          <RouterLink to="/profile">{{ t('auth.account') }}</RouterLink>
        </div>
      </div>

      <div>
        <h3 class="mb-4 text-sm font-bold uppercase tracking-wider text-orange-300">{{ t('footer.support') }}</h3>
        <div class="grid gap-2 text-sm text-slate-300">
          <span>{{ t('footer.shipping') }}</span>
          <span>{{ t('footer.payment') }}</span>
          <span>{{ t('footer.contact') }}</span>
        </div>
      </div>
    </div>
    <div class="border-t border-white/10 px-6 py-4 text-center text-xs text-slate-400">
      {{ t('footer.copyright') }}
    </div>
  </footer>
</template>
