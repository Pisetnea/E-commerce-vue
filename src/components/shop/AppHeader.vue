<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import LanguageSwitcher from '../languageSwitcher.vue'
import { createOrder } from '../../service/orders'
import { useAuthStore } from '../../stores/auth'
import { useCartStore } from '../../stores/cart'
import { useProductsStore } from '../../stores/products'
import { useThemeStore } from '../../stores/theme'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const cartStore = useCartStore()
const productsStore = useProductsStore()
const themeStore = useThemeStore()
const drawer = ref(false)
const search = ref('')
const checkoutLoading = ref(false)
const checkoutError = ref('')
const checkoutSuccess = ref('')
const paymentMethod = ref('card')
const paymentReference = ref('')

const categories = computed(() => [
  { label: t('nav.apparel'), value: 'Apparel' },
  { label: t('nav.bags'), value: 'Bags' },
  { label: t('nav.electronics'), value: 'Electronics' },
  { label: t('nav.homeGoods'), value: 'Home' },
])
const subtotalLabel = computed(() => `$${cartStore.subtotal.toFixed(2)}`)
const taxLabel = computed(() => `$${cartStore.tax.toFixed(2)}`)
const shippingLabel = computed(() => (cartStore.shipping ? `$${cartStore.shipping.toFixed(2)}` : t('cart.free')))
const totalLabel = computed(() => `$${cartStore.total.toFixed(2)}`)
const checkoutDisabled = computed(
  () => cartStore.isEmpty || checkoutLoading.value || (paymentMethod.value !== 'cash' && !paymentReference.value.trim()),
)
const paymentOptions = computed(() => [
  { title: t('payment.card'), value: 'card', props: { prependIcon: 'mdi-credit-card-outline' } },
  { title: t('payment.paypal'), value: 'paypal', props: { prependIcon: 'mdi-wallet-outline' } },
  { title: t('payment.cash'), value: 'cash', props: { prependIcon: 'mdi-cash' } },
])

async function submitSearch() {
  await productsStore.setSearch(search.value)
}

function goToAuth(name, message) {
  authStore.notice = message
  router.push({ name, query: { redirect: route.fullPath } })
}

function goToCategory(category) {
  router.push({ name: 'home', query: { category } })
}

async function checkout() {
  if (!authStore.requireAuth(t('auth.checkoutRequired'))) {
    goToAuth('login', t('auth.checkoutRequired'))
    return
  }

  checkoutLoading.value = true
  checkoutError.value = ''
  checkoutSuccess.value = ''

  try {
    await createOrder(cartStore.items, {
      method: paymentMethod.value,
      reference: paymentReference.value.trim(),
    })
    cartStore.clearCart()
    paymentReference.value = ''
    checkoutSuccess.value = t('cart.orderSuccess')
  } catch (error) {
    checkoutError.value = error.response?.data?.message ?? t('cart.checkoutFailed')
  } finally {
    checkoutLoading.value = false
  }
}

async function logout() {
  await authStore.logout()
  cartStore.clearCart()
  router.push('/')
}

onMounted(() => {
  authStore.fetchProfile()
  cartStore.fetchCart()
})
</script>

<template>
  <v-app-bar class="app-header" color="transparent" elevation="0" height="84">
    <v-container class="d-flex align-center ga-4 py-0" fluid>
      <RouterLink class="brand-link d-flex align-center ga-3 text-primary" to="/">
        <v-avatar class="brand-mark" rounded="lg" size="42">
          <v-icon icon="mdi-shopping-outline" size="22" />
        </v-avatar>
        <span class="text-h6 font-weight-black d-none d-sm-inline">Ecommercer</span>
      </RouterLink>

      <div class="d-none d-lg-flex align-center ga-1">
        <v-btn
          v-for="category in categories"
          :key="category.value"
          class="nav-pill"
          :text="category.label"
          rounded="lg"
          size="small"
          variant="flat"
          @click="goToCategory(category.value)"
        />
      </div>

      <v-spacer />

      <v-text-field
        v-model="search"
        class="header-search"
        clearable
        density="compact"
        hide-details
        :placeholder="t('nav.search')"
        prepend-inner-icon="mdi-magnify"
        rounded="lg"
        variant="solo"
        @click:clear="productsStore.setSearch('')"
        @keyup.enter="submitSearch"
      />

      <LanguageSwitcher class="d-none d-md-block" />

      <v-btn
        :aria-label="t('theme.toggle')"
        class="theme-button"
        :icon="themeStore.icon"
        variant="flat"
        @click="themeStore.toggleTheme"
      />

      <template v-if="authStore.isAuthenticated">
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              :aria-label="authStore.customerName"
              class="profile-avatar-button"
              icon
              variant="flat"
            >
              <v-avatar size="42">
                <v-img v-if="authStore.avatarUrl" :alt="authStore.customerName" cover :src="authStore.avatarUrl" />
                <span v-else>{{ authStore.initials }}</span>
              </v-avatar>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item :subtitle="authStore.user?.email" :title="authStore.customerName">
              <template #prepend>
                <v-avatar size="36">
                  <v-img v-if="authStore.avatarUrl" :alt="authStore.customerName" cover :src="authStore.avatarUrl" />
                  <span v-else>{{ authStore.initials }}</span>
                </v-avatar>
              </template>
            </v-list-item>
            <v-divider />
            <v-list-item :title="t('auth.account')" prepend-icon="mdi-account-outline" @click="router.push('/profile')" />
            <v-list-item :title="t('auth.logout')" prepend-icon="mdi-logout" @click="logout" />
          </v-list>
        </v-menu>
      </template>

      <div v-else class="d-none d-md-flex align-center ga-2">
        <v-btn rounded="lg" variant="text" @click="goToAuth('login', '')">
          {{ t('auth.login') }}
        </v-btn>
        <v-btn color="secondary" rounded="lg" variant="flat" @click="goToAuth('register', '')">
          {{ t('auth.register') }}
        </v-btn>
      </div>

      <v-badge :content="cartStore.itemCount" :model-value="cartStore.itemCount > 0" color="accent">
        <v-btn
          aria-label="Open shopping cart"
          class="cart-button"
          icon="mdi-cart-outline"
          variant="flat"
          @click="drawer = true"
        />
      </v-badge>
    </v-container>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" class="cart-drawer" location="right" temporary width="440">
    <div class="d-flex flex-column h-100">
      <div class="cart-drawer__header d-flex align-center justify-space-between pa-5">
        <div>
          <p class="text-overline mb-0">{{ t('cart.title') }}</p>
          <h2 class="text-h6 font-weight-bold">{{ t('cart.yourItems') }}</h2>
        </div>
        <v-btn aria-label="Close shopping cart" icon="mdi-close" variant="flat" @click="drawer = false" />
      </div>

      <v-list v-if="cartStore.items.length" class="flex-grow-1 overflow-y-auto cart-list" lines="three">
        <v-list-item v-for="item in cartStore.items" :key="item.product.id" class="cart-item mx-3 my-2 py-3">
          <template #prepend>
            <v-img :src="item.product.image" class="rounded-lg mr-3" cover height="72" width="72" />
          </template>

          <v-list-item-title class="font-weight-semibold text-wrap">
            {{ item.product.title }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-primary font-weight-bold mt-1">
            ${{ item.product.price.toFixed(2) }}
          </v-list-item-subtitle>

          <div class="d-flex align-center justify-space-between mt-3">
            <v-btn-group border density="compact" divided rounded="lg" variant="outlined">
              <v-btn
                aria-label="Decrease quantity"
                icon="mdi-minus"
                size="small"
                @click="cartStore.decrement(item.product.id)"
              />
              <v-btn :text="String(item.quantity)" min-width="44" size="small" />
              <v-btn
                aria-label="Increase quantity"
                icon="mdi-plus"
                size="small"
                @click="cartStore.increment(item.product.id)"
              />
            </v-btn-group>

            <v-btn
              aria-label="Remove item"
              color="error"
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              @click="cartStore.removeItem(item.product.id)"
            />
          </div>
        </v-list-item>
      </v-list>

      <v-empty-state
        v-else
        class="flex-grow-1"
        icon="mdi-cart-outline"
        :text="authStore.isAuthenticated ? t('cart.emptyText') : t('auth.cartRequired')"
        :title="t('cart.emptyTitle')"
      />

      <div class="cart-footer pa-4">
        <v-alert v-if="cartStore.error" class="mb-3" color="warning" density="compact" variant="tonal">
          {{ cartStore.error }}
        </v-alert>
        <v-alert v-if="checkoutError" class="mb-3" color="error" density="compact" variant="tonal">
          {{ checkoutError }}
        </v-alert>
        <v-alert v-if="checkoutSuccess" class="mb-3" color="success" density="compact" variant="tonal">
          {{ checkoutSuccess }}
        </v-alert>

        <v-select
          v-model="paymentMethod"
          class="mb-3"
          density="comfortable"
          hide-details
          :items="paymentOptions"
          :label="t('payment.method')"
          variant="outlined"
        />
        <v-text-field
          v-if="paymentMethod !== 'cash'"
          v-model="paymentReference"
          class="mb-3"
          density="comfortable"
          hide-details
          :label="t('payment.reference')"
          prepend-inner-icon="mdi-shield-check-outline"
          variant="outlined"
        />

        <div class="summary-line">
          <span class="text-body-1 text-medium-emphasis">{{ t('cart.subtotal') }}</span>
          <strong class="text-h6">{{ subtotalLabel }}</strong>
        </div>
        <div class="summary-line">
          <span class="text-body-2 text-medium-emphasis">{{ t('cart.tax') }}</span>
          <strong>{{ taxLabel }}</strong>
        </div>
        <div class="summary-line mb-4">
          <span class="text-body-2 text-medium-emphasis">{{ t('cart.shipping') }}</span>
          <strong>{{ shippingLabel }}</strong>
        </div>
        <v-divider class="mb-4" />
        <div class="summary-line mb-4">
          <span class="text-body-1 font-weight-bold">{{ t('cart.total') }}</span>
          <strong class="text-h5">{{ totalLabel }}</strong>
        </div>
        <v-btn
          block
          color="primary"
          :disabled="checkoutDisabled"
          :loading="checkoutLoading"
          prepend-icon="mdi-lock-check-outline"
          size="large"
          @click="checkout"
        >
          {{ t('cart.checkout') }}
        </v-btn>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<style scoped>
.app-header {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.76)),
    rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  backdrop-filter: blur(22px);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

:global(.v-theme--dark) .app-header {
  background:
    linear-gradient(135deg, rgba(17, 24, 39, 0.94), rgba(15, 23, 42, 0.8)),
    rgba(17, 24, 39, 0.88);
  border-bottom-color: rgba(148, 163, 184, 0.16);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
}

.brand-link {
  min-width: max-content;
}

.brand-mark {
  background: linear-gradient(135deg, #1f2937, #0d9488);
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(13, 148, 136, 0.28);
}

.nav-pill {
  background: rgba(15, 23, 42, 0.04);
  color: #334155;
  transition:
    background-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.nav-pill:hover {
  background: rgba(13, 148, 136, 0.12);
  color: #0f766e;
  transform: translateY(-1px);
}

.cart-button {
  background: #172033;
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.2);
}

.theme-button {
  background: rgba(15, 23, 42, 0.06);
  color: #172033;
}

.profile-avatar-button {
  background: rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  color: #172033;
  height: 48px;
  min-width: 48px;
  padding: 3px;
}

.profile-avatar-button :deep(.v-avatar) {
  background: linear-gradient(135deg, #0f766e, #172033);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 800;
}

.header-search {
  max-width: 360px;
}

.header-search :deep(.v-field) {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.cart-drawer {
  background: #f8fafc;
}

:global(.v-theme--dark) .nav-pill,
:global(.v-theme--dark) .profile-avatar-button,
:global(.v-theme--dark) .theme-button {
  background: rgba(229, 237, 245, 0.08);
  color: #e5edf5;
}

:global(.v-theme--dark) .nav-pill:hover {
  background: rgba(45, 212, 191, 0.16);
  color: #5eead4;
}

:global(.v-theme--dark) .header-search :deep(.v-field) {
  background: rgba(17, 24, 39, 0.9);
  border-color: rgba(148, 163, 184, 0.16);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
}

:global(.v-theme--dark) .cart-button {
  background: #e5edf5;
  color: #0b1120;
}

:global(.v-theme--dark) .cart-drawer {
  background: #0f172a;
}

.cart-drawer__header {
  background: linear-gradient(135deg, #1f2937, #0f766e);
  color: #ffffff;
}

.cart-item {
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

:global(.v-theme--dark) .cart-item {
  background: rgba(17, 24, 39, 0.96);
  border-color: rgba(148, 163, 184, 0.14);
}

.cart-footer {
  background: rgba(255, 255, 255, 0.94);
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 -18px 44px rgba(15, 23, 42, 0.08);
}

.summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.35rem;
}

:global(.v-theme--dark) .cart-footer {
  background: rgba(17, 24, 39, 0.96);
  border-top-color: rgba(148, 163, 184, 0.14);
  box-shadow: 0 -18px 44px rgba(0, 0, 0, 0.24);
}

@media (max-width: 599px) {
  .header-search {
    max-width: 190px;
  }
}
</style>
