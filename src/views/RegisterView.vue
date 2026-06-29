<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const formRef = ref(null)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const rules = {
  required: (value) => Boolean(value) || t('auth.validation.required'),
  email: (value) => /.+@.+\..+/.test(value) || t('auth.validation.email'),
  minName: (value) => String(value || '').trim().length >= 2 || t('auth.validation.nameMin'),
  minPassword: (value) => String(value || '').length >= 6 || t('auth.validation.passwordMin'),
  passwordMatch: (value) => value === form.password || t('auth.validation.passwordMatch'),
}

const passwordStrength = computed(() => {
  let score = 0
  if (form.password.length >= 6) score += 34
  if (/[A-Z]/.test(form.password) && /[a-z]/.test(form.password)) score += 33
  if (/\d|[^A-Za-z]/.test(form.password)) score += 33
  return score
})
const passwordStrengthColor = computed(() => {
  if (passwordStrength.value >= 80) return 'success'
  if (passwordStrength.value >= 50) return 'warning'
  return 'error'
})
const passwordStrengthLabel = computed(() => {
  if (!form.password) return t('auth.passwordStrength.empty')
  if (passwordStrength.value >= 80) return t('auth.passwordStrength.strong')
  if (passwordStrength.value >= 50) return t('auth.passwordStrength.medium')
  return t('auth.passwordStrength.weak')
})
const canSubmit = computed(
  () => form.name && form.email && form.password && form.password_confirmation && !authStore.loading,
)

async function submit() {
  const result = await formRef.value?.validate()
  if (!result?.valid) return

  const success = await authStore.register(form)

  if (success) {
    router.push(route.query.redirect || '/')
  }
}
</script>

<template>
  <v-container class="auth-page py-10">
    <v-row justify="center">
      <v-col cols="12" md="5" sm="8">
        <v-sheet class="auth-card pa-6 pa-md-8" rounded="lg">
          <v-chip class="mb-4 auth-chip" color="secondary" label variant="flat">{{ t('auth.newCustomer') }}</v-chip>
          <h1 class="text-h4 font-weight-black mb-2">{{ t('auth.registerTitle') }}</h1>
          <p class="text-body-2 text-medium-emphasis mb-6">
            {{ t('auth.registerHint') }}
          </p>

          <v-alert v-if="authStore.notice" class="mb-4" color="warning" variant="tonal">
            {{ authStore.notice }}
          </v-alert>
          <v-alert v-if="authStore.error" class="mb-4" color="error" variant="tonal">
            {{ authStore.error }}
          </v-alert>

          <v-form ref="formRef" validate-on="submit" @submit.prevent="submit">
            <v-text-field
              v-model="form.name"
              class="mb-3"
              autocomplete="name"
              :label="t('auth.name')"
              prepend-inner-icon="mdi-account-outline"
              :rules="[rules.required, rules.minName]"
              variant="outlined"
            />
            <v-text-field
              v-model="form.email"
              class="mb-3"
              autocomplete="email"
              :label="t('auth.email')"
              prepend-inner-icon="mdi-email-outline"
              :rules="[rules.required, rules.email]"
              type="email"
              variant="outlined"
            />
            <v-text-field
              v-model="form.password"
              class="mb-2"
              autocomplete="new-password"
              :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              :label="t('auth.password')"
              prepend-inner-icon="mdi-lock-outline"
              :rules="[rules.required, rules.minPassword]"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              @click:append-inner="showPassword = !showPassword"
            />
            <div class="mb-3">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="text-caption text-medium-emphasis">{{ t('auth.passwordStrength.label') }}</span>
                <span class="text-caption font-weight-bold">{{ passwordStrengthLabel }}</span>
              </div>
              <v-progress-linear
                :color="passwordStrengthColor"
                height="6"
                rounded
                :model-value="passwordStrength"
              />
            </div>
            <v-text-field
              v-model="form.password_confirmation"
              class="mb-5"
              autocomplete="new-password"
              :append-inner-icon="showConfirmPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              :label="t('auth.confirmPassword')"
              prepend-inner-icon="mdi-lock-check-outline"
              :rules="[rules.required, rules.passwordMatch]"
              :type="showConfirmPassword ? 'text' : 'password'"
              variant="outlined"
              @click:append-inner="showConfirmPassword = !showConfirmPassword"
            />

            <v-btn
              block
              color="primary"
              :disabled="!canSubmit"
              :loading="authStore.loading"
              prepend-icon="mdi-account-plus-outline"
              size="large"
              type="submit"
            >
              {{ t('auth.register') }}
            </v-btn>
          </v-form>

          <div class="d-flex align-center justify-center ga-2 mt-5">
            <span class="text-body-2 text-medium-emphasis">{{ t('auth.alreadyRegistered') }}</span>
            <RouterLink class="text-secondary font-weight-bold" :to="{ name: 'login', query: route.query }">
              {{ t('auth.login') }}
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

.auth-chip {
  border-radius: 8px;
}

:global(.v-theme--dark) .auth-card {
  background: rgba(17, 24, 39, 0.94);
  border-color: rgba(148, 163, 184, 0.16);
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.24);
}
</style>
