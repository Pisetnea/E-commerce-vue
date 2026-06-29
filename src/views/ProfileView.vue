<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useProductsStore } from '../stores/products'
import { useWishlistStore } from '../stores/wishlist'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const cartStore = useCartStore()
const productsStore = useProductsStore()
const wishlistStore = useWishlistStore()
const activePanel = ref('cart')
const editProfileDialog = ref(false)
const selectedAvatarFile = ref(null)
const avatarPreview = ref('')
const profileForm = reactive({
  name: '',
})

const profileAvatar = computed(() => avatarPreview.value || authStore.avatarUrl)
const wishlistItems = computed(() =>
  wishlistStore.productIds.map((productId) => {
    const product = productsStore.products.find((item) => item.id === productId)
    return product ?? { id: productId, title: t('profile.savedProduct', { id: productId }) }
  }),
)
const stats = computed(() => [
  {
    key: 'cart',
    icon: 'mdi-cart-outline',
    iconClass: 'text-teal-600',
    label: t('profile.cartItems'),
    value: cartStore.itemCount,
  },
  {
    key: 'wishlist',
    icon: 'mdi-heart-outline',
    iconClass: 'text-rose-500',
    label: t('profile.wishlistItems'),
    value: wishlistStore.productIds.length,
  },
  {
    key: 'payment',
    icon: 'mdi-credit-card-outline',
    iconClass: 'text-orange-500',
    label: t('profile.paymentStatus'),
    value: t('profile.paymentReady'),
  },
])

function openProfileEditor() {
  profileForm.name = authStore.customerName
  avatarPreview.value = authStore.avatarUrl
  selectedAvatarFile.value = null
  editProfileDialog.value = true
}

function handleAvatarFile(files) {
  const file = Array.isArray(files) ? files[0] : files
  if (!file) return

  selectedAvatarFile.value = file

  const reader = new FileReader()
  reader.onload = () => {
    avatarPreview.value = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}

async function saveProfile() {
  const success = await authStore.saveProfile({
    name: profileForm.name.trim() || authStore.customerName,
    avatar: selectedAvatarFile.value,
    avatarPreview: avatarPreview.value,
  })

  if (success) {
    editProfileDialog.value = false
  }
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    authStore.notice = t('auth.requiredNotice')
    router.push({ name: 'login', query: { redirect: '/profile' } })
    return
  }

  await authStore.fetchProfile()
  await Promise.all([
    cartStore.fetchCart(),
    productsStore.products.length ? Promise.resolve() : productsStore.fetchProducts(),
  ])
})
</script>

<template>
  <main class="mx-auto max-w-[1180px] px-4 py-10">
    <section class="overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/10">
      <div class="bg-gradient-to-br from-slate-900 via-teal-800 to-orange-500 px-6 py-10 text-white md:px-10">
          <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-5">
            <v-avatar class="profile-hero-avatar" size="80">
              <v-img v-if="profileAvatar" :alt="authStore.customerName" cover :src="profileAvatar" />
              <span v-else>{{ authStore.initials }}</span>
            </v-avatar>
            <div>
              <p class="text-sm font-semibold uppercase tracking-wider text-white/70">{{ t('profile.title') }}</p>
              <h1 class="text-3xl font-black md:text-4xl">{{ authStore.customerName }}</h1>
              <p class="mt-1 text-white/75">{{ authStore.user?.email }}</p>
            </div>
          </div>
          <v-btn color="white" prepend-icon="mdi-pencil-outline" rounded="lg" variant="flat" @click="openProfileEditor">
            {{ t('profile.edit') }}
          </v-btn>
        </div>
      </div>

      <div class="grid gap-4 p-6 md:grid-cols-3 md:p-10">
        <button
          v-for="stat in stats"
          :key="stat.key"
          :class="[
            'profile-stat rounded-lg border p-5 text-left transition',
            activePanel === stat.key ? 'profile-stat--active' : '',
          ]"
          type="button"
          @click="activePanel = stat.key"
        >
          <v-icon class="mb-4" :class="stat.iconClass" :icon="stat.icon" size="32" />
          <p class="text-sm text-slate-500">{{ stat.label }}</p>
          <strong :class="stat.key === 'payment' ? 'text-xl' : 'text-3xl'" class="text-slate-900">
            {{ stat.value }}
          </strong>
        </button>
      </div>

      <div class="px-6 pb-8 md:px-10">
        <section v-if="activePanel === 'cart'" class="profile-panel rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">{{ t('profile.cartItems') }}</p>
              <h2 class="text-xl font-black text-slate-900">{{ t('cart.yourItems') }}</h2>
            </div>
            <strong class="text-lg text-slate-900">${{ cartStore.total.toFixed(2) }}</strong>
          </div>

          <v-list v-if="cartStore.items.length" class="profile-list" lines="two">
            <v-list-item v-for="item in cartStore.items" :key="item.id">
              <template #prepend>
                <v-img :src="item.product.image" class="mr-3 rounded-lg" cover height="56" width="56" />
              </template>
              <v-list-item-title class="font-weight-bold">{{ item.product.title }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ item.quantity }} x ${{ item.product.price.toFixed(2) }}
              </v-list-item-subtitle>
              <template #append>
                <strong>${{ (item.quantity * item.product.price).toFixed(2) }}</strong>
              </template>
            </v-list-item>
          </v-list>

          <v-empty-state
            v-else
            icon="mdi-cart-outline"
            :text="t('cart.emptyText')"
            :title="t('cart.emptyTitle')"
          />
        </section>

        <section v-else-if="activePanel === 'wishlist'" class="profile-panel rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div class="mb-4">
            <p class="text-sm text-slate-500">{{ t('profile.wishlistItems') }}</p>
            <h2 class="text-xl font-black text-slate-900">{{ t('profile.savedItems') }}</h2>
          </div>

          <v-list v-if="wishlistItems.length" class="profile-list" lines="two">
            <v-list-item
              v-for="item in wishlistItems"
              :key="item.id"
              :title="item.title"
              :subtitle="item.category ?? t('shop.favorite')"
              @click="item.raw && router.push({ name: 'product-detail', params: { id: item.id } })"
            >
              <template #prepend>
                <v-img
                  v-if="item.image"
                  :src="item.image"
                  class="mr-3 rounded-lg"
                  cover
                  height="56"
                  width="56"
                />
                <v-avatar v-else class="mr-3" color="pink-lighten-5" rounded="lg">
                  <v-icon color="error" icon="mdi-heart-outline" />
                </v-avatar>
              </template>
              <template #append>
                <strong v-if="item.price">${{ item.price.toFixed(2) }}</strong>
                <v-icon v-else icon="mdi-chevron-right" />
              </template>
            </v-list-item>
          </v-list>

          <v-empty-state
            v-else
            icon="mdi-heart-outline"
            :text="t('profile.emptyWishlistText')"
            :title="t('profile.emptyWishlist')"
          />
        </section>

        <section v-else class="profile-panel rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div class="mb-4">
            <p class="text-sm text-slate-500">{{ t('profile.paymentStatus') }}</p>
            <h2 class="text-xl font-black text-slate-900">{{ t('profile.paymentReady') }}</h2>
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <div class="rounded-lg border border-slate-200 bg-white p-4">
              <p class="text-sm text-slate-500">{{ t('cart.subtotal') }}</p>
              <strong class="text-lg text-slate-900">${{ cartStore.subtotal.toFixed(2) }}</strong>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-4">
              <p class="text-sm text-slate-500">{{ t('cart.shipping') }}</p>
              <strong class="text-lg text-slate-900">
                {{ cartStore.shipping ? `$${cartStore.shipping.toFixed(2)}` : t('cart.free') }}
              </strong>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-4">
              <p class="text-sm text-slate-500">{{ t('cart.total') }}</p>
              <strong class="text-lg text-slate-900">${{ cartStore.total.toFixed(2) }}</strong>
            </div>
          </div>
        </section>
      </div>
    </section>

    <v-dialog v-model="editProfileDialog" max-width="460">
      <v-card class="profile-dialog" rounded="lg">
        <v-card-title class="font-weight-black">{{ t('profile.edit') }}</v-card-title>
        <v-card-text>
          <div class="d-flex flex-column align-center ga-4 mb-5">
            <v-avatar class="profile-edit-avatar" size="112">
              <v-img v-if="profileAvatar" :alt="authStore.customerName" cover :src="profileAvatar" />
              <span v-else>{{ authStore.initials }}</span>
            </v-avatar>
            <v-file-input
              accept="image/*"
              density="comfortable"
              hide-details
              :label="t('profile.profileImage')"
              prepend-icon=""
              prepend-inner-icon="mdi-camera-outline"
              variant="outlined"
              @update:model-value="handleAvatarFile"
            />
          </div>
          <v-text-field
            v-model="profileForm.name"
            :label="t('auth.name')"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
          />
          <v-alert v-if="authStore.error" class="mt-3" color="warning" density="compact" variant="tonal">
            {{ authStore.error }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editProfileDialog = false">{{ t('profile.cancel') }}</v-btn>
          <v-btn color="primary" :loading="authStore.loading" variant="flat" @click="saveProfile">
            {{ t('profile.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </main>
</template>

<style scoped>
.profile-hero-avatar {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 900;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.24);
}

.profile-edit-avatar {
  background: linear-gradient(135deg, #0f766e, #172033);
  color: #ffffff;
  font-size: 2rem;
  font-weight: 900;
}

.profile-dialog {
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.profile-stat {
  background: #f8fafc;
  border-color: #e2e8f0;
  cursor: pointer;
}

.profile-stat:hover,
.profile-stat--active {
  background: #ffffff;
  border-color: #0d9488;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.1);
  transform: translateY(-2px);
}

.profile-panel,
.profile-list {
  background: #f8fafc;
}

:global(.v-theme--dark) .profile-stat,
:global(.v-theme--dark) .profile-panel,
:global(.v-theme--dark) .profile-list {
  background: rgba(17, 24, 39, 0.94);
  border-color: rgba(148, 163, 184, 0.18);
}

:global(.v-theme--dark) .profile-stat:hover,
:global(.v-theme--dark) .profile-stat--active {
  background: rgba(30, 41, 59, 0.96);
  border-color: #2dd4bf;
}
</style>
