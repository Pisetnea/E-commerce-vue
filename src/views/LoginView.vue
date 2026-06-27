<script setup>
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

async function submit() {
  const success = await authStore.login(form)

  if (success) {
    router.push(route.query.redirect || '/')
  }
}
</script>

<template>
  <v-container class="auth-page py-10">
    <v-row justify="center">
      <v-col cols="12" md="5" sm="8">
        <v-sheet class="auth-card pa-6 pa-md-8" rounded="xl">
          <v-chip class="mb-4" color="secondary" label variant="flat">{{ t('auth.customerAccount') }}</v-chip>
          <h1 class="text-h4 font-weight-black mb-2">{{ t('auth.loginTitle') }}</h1>
          <p class="text-body-2 text-medium-emphasis mb-6">
            {{ t('auth.loginHint') }}
          </p>

          <v-alert v-if="authStore.notice" class="mb-4" color="warning" variant="tonal">
            {{ authStore.notice }}
          </v-alert>
          <v-alert v-if="authStore.error" class="mb-4" color="error" variant="tonal">
            {{ authStore.error }}
          </v-alert>

          <v-form @submit.prevent="submit">
            <v-text-field
              v-model="form.email"
              class="mb-3"
              :label="t('auth.email')"
              prepend-inner-icon="mdi-email-outline"
              required
              type="email"
              variant="outlined"
            />
            <v-text-field
              v-model="form.password"
              class="mb-5"
              :label="t('auth.password')"
              prepend-inner-icon="mdi-lock-outline"
              required
              type="password"
              variant="outlined"
            />

            <v-btn block color="primary" :loading="authStore.loading" size="large" type="submit">
              {{ t('auth.login') }}
            </v-btn>
          </v-form>

          <div class="d-flex align-center justify-center ga-2 mt-5">
            <span class="text-body-2 text-medium-emphasis">{{ t('auth.noAccount') }}</span>
            <RouterLink class="text-secondary font-weight-bold" :to="{ name: 'register', query: route.query }">
              {{ t('auth.register') }}
            </RouterLink>
          </div>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.auth-page {
  max-width: 1180px;
}

.auth-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.1);
}
</style>
