<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const initials = computed(() => authStore.customerName.slice(0, 2).toUpperCase())

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    authStore.notice = t('auth.requiredNotice')
    router.push({ name: 'login', query: { redirect: '/profile' } })
    return
  }

  await authStore.fetchProfile()
})
</script>

<template>
  <main class="mx-auto max-w-[1180px] px-4 py-10">
    <section class="overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/10">
      <div class="bg-gradient-to-br from-slate-900 via-teal-800 to-orange-500 px-6 py-10 text-white md:px-10">
        <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-5">
            <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-2xl font-black shadow-xl backdrop-blur-md">
              {{ initials }}
            </div>
            <div>
              <p class="text-sm font-semibold uppercase tracking-wider text-white/70">{{ t('profile.title') }}</p>
              <h1 class="text-3xl font-black md:text-4xl">{{ authStore.customerName }}</h1>
              <p class="mt-1 text-white/75">{{ authStore.user?.email }}</p>
            </div>
          </div>
          <v-btn color="white" prepend-icon="mdi-pencil-outline" rounded="lg" variant="flat">
            {{ t('profile.edit') }}
          </v-btn>
        </div>
      </div>

      <div class="grid gap-4 p-6 md:grid-cols-3 md:p-10">
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <v-icon class="mb-4 text-teal-600" icon="mdi-cart-outline" size="32" />
          <p class="text-sm text-slate-500">{{ t('profile.cartItems') }}</p>
          <strong class="text-3xl text-slate-900">{{ cartStore.itemCount }}</strong>
        </div>
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <v-icon class="mb-4 text-rose-500" icon="mdi-heart-outline" size="32" />
          <p class="text-sm text-slate-500">{{ t('profile.wishlistItems') }}</p>
          <strong class="text-3xl text-slate-900">{{ wishlistStore.productIds.length }}</strong>
        </div>
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <v-icon class="mb-4 text-orange-500" icon="mdi-credit-card-outline" size="32" />
          <p class="text-sm text-slate-500">{{ t('profile.paymentStatus') }}</p>
          <strong class="text-xl text-slate-900">{{ t('profile.paymentReady') }}</strong>
        </div>
      </div>
    </section>
  </main>
</template>
