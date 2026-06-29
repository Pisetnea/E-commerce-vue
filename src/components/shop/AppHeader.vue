<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import LanguageSwitcher from '../languageSwitcher.vue'
import { createOrder } from '../../service/orders'
import { useAuthStore } from '../../stores/auth'
import { useCartStore } from '../../stores/cart'
import { useProductsStore } from '../../stores/products'
import { useWishlistStore } from '../../stores/wishlist'
import { useThemeStore } from '../../stores/theme'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const cartStore = useCartStore()
const productsStore = useProductsStore()
const wishlistStore = useWishlistStore()
const themeStore = useThemeStore()
const drawer = ref(false)
const search = ref('')
const checkoutLoading = ref(false)
const checkoutError = ref('')
const checkoutSuccess = ref('')
const deliveryOption = ref('zando_bikers')
const address = ref('')
const showAddressForm = ref(false)
const paymentMethod = ref('aba_pay')
const paymentReference = ref('')
const contactMethod = ref('phone_call')
const contactValue = ref('')
const cardholderName = ref('')
const cardNumber = ref('')
const expiryDate = ref('')
const cvv = ref('')

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
const cardBrand = computed(() => {
  const n = cardNumber.value.replace(/\D/g, '')
  if (n.startsWith('4')) return 'visa'
  if (/^5[1-5]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  return ''
})
const formattedDisplay = computed(() => {
  const n = cardNumber.value.replace(/\D/g, '')
  const groups = n.match(/.{1,4}/g)
  return groups ? groups.join(' ') : ''
})
const isValidCreditCard = computed(() => {
  if (paymentMethod.value !== 'credit_card') return true
  const n = cardNumber.value.replace(/\D/g, '')
  if (n.length < 13 || n.length > 16) return false
  let sum = 0; let alt = false
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i])
    if (alt) { d *= 2; if (d > 9) d -= 9 }
    sum += d; alt = !alt
  }
  return sum % 10 === 0
})
const checkoutDisabled = computed(() => {
  if (cartStore.isEmpty || checkoutLoading.value) return true
  if (paymentMethod.value === 'credit_card') {
    return !cardholderName.value.trim() || !cardNumber.value.trim() || !isValidCreditCard.value || !expiryDate.value.trim() || !cvv.value.trim()
  }
  return paymentMethod.value !== 'cash' && !paymentReference.value.trim()
})

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

function formatCardNumber(e) {
  const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
  cardNumber.value = raw.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(e) {
  let raw = e.target.value.replace(/\D/g, '').slice(0, 4)
  if (raw.length > 2) raw = raw.slice(0, 2) + '/' + raw.slice(2)
  expiryDate.value = raw
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
    const isCard = paymentMethod.value === 'credit_card'
    await createOrder(cartStore.items, {
      method: paymentMethod.value,
      reference: isCard ? '' : paymentReference.value.trim(),
      cardholderName: cardholderName.value,
      cardNumber: cardNumber.value,
      expiryDate: expiryDate.value,
      cvv: cvv.value,
    }, {
      address: address.value,
      deliveryOption: deliveryOption.value,
      contactMethod: contactMethod.value,
      contactValue: contactValue.value,
    })
    cartStore.clearCart()
    paymentReference.value = ''
    cardholderName.value = ''
    cardNumber.value = ''
    expiryDate.value = ''
    cvv.value = ''
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

      <v-badge
        :content="wishlistStore.productIds.length"
        :model-value="wishlistStore.productIds.length > 0"
        color="error"
      >
        <v-btn
          aria-label="Open wishlist"
          class="wishlist-button"
          icon="mdi-heart-outline"
          variant="flat"
          @click="router.push('/wishlist')"
        />
      </v-badge>

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

  <v-navigation-drawer v-model="drawer" class="cart-drawer" location="right" temporary width="660">
    <div class="d-flex flex-column h-100">
      <div class="cart-drawer__header d-flex align-center justify-space-between pa-4">
        <h2 class="text-h6 font-weight-bold">{{ t('checkout.deliveryAndOrder') }}</h2>
        <v-btn aria-label="Close shopping cart" icon="mdi-close" variant="flat" @click="drawer = false" />
      </div>

      <div class="flex-grow-1 overflow-y-auto pa-4">
        <v-alert v-if="cartStore.error" class="mb-3" color="warning" density="compact" variant="tonal">
          {{ cartStore.error }}
        </v-alert>

        <!-- Delivery Address -->
        <div class="checkout-section mb-4">
          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2" color="primary" size="small">mdi-truck-outline</v-icon>
            <span class="text-subtitle-2 font-weight-bold">{{ t('delivery.address') }}</span>
          </div>
          <v-card variant="outlined" class="pa-4 rounded-lg">
            <template v-if="!address">
              <v-btn
                block
                color="primary"
                variant="tonal"
                prepend-icon="mdi-plus"
                @click="showAddressForm = true"
              >
                {{ t('delivery.addAddress') }}
              </v-btn>
            </template>
            <template v-else-if="showAddressForm">
              <v-textarea
                v-model="address"
                auto-grow
                :label="t('delivery.addressPlaceholder')"
                rows="2"
                variant="outlined"
              />
              <div class="d-flex ga-2 mt-2">
                <v-btn color="primary" size="small" variant="flat" @click="showAddressForm = false">
                  {{ t('profile.save') }}
                </v-btn>
                <v-btn size="small" variant="text" @click="address = ''; showAddressForm = false">
                  {{ t('profile.cancel') }}
                </v-btn>
              </div>
            </template>
            <template v-else>
              <p class="text-body-2 mb-2">{{ address }}</p>
              <v-btn
                size="x-small"
                variant="text"
                color="primary"
                prepend-icon="mdi-pencil"
                @click="showAddressForm = true"
              >
                {{ t('delivery.editAddress') }}
              </v-btn>
            </template>

            <v-divider class="my-3" />

            <span class="text-caption font-weight-bold text-medium-emphasis">{{ t('delivery.option') }}</span>
            <v-radio-group v-model="deliveryOption" hide-details class="mt-1">
              <v-radio :label="t('delivery.virakBuntham')" value="virak_buntham" color="primary" />
              <v-radio :label="t('delivery.zandoBikers')" value="zando_bikers" color="primary" />
            </v-radio-group>
          </v-card>
        </div>

        <!-- My Shopping Bag -->
        <div class="checkout-section mb-4">
          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2" color="primary" size="small">mdi-bag-personal-outline</v-icon>
            <span class="text-subtitle-2 font-weight-bold">{{ t('checkout.myShoppingBag') }}</span>
            <v-chip v-if="cartStore.items.length" class="ml-2" color="primary" size="x-small" variant="flat">
              {{ cartStore.itemCount }}
            </v-chip>
          </div>

          <div v-if="cartStore.items.length" class="d-flex flex-column ga-2">
            <div
              v-for="item in cartStore.items"
              :key="item.product.id"
              class="cart-item d-flex align-center pa-3 ga-3 rounded-lg"
            >
              <v-img
                :src="item.product.image"
                class="rounded flex-shrink-0"
                cover
                height="64"
                width="64"
              />
              <div class="flex-grow-1 min-w-0">
                <p class="text-body-2 font-weight-semibold text-truncate mb-1">{{ item.product.title }}</p>
                <p class="text-primary font-weight-bold text-body-2">${{ item.product.price.toFixed(2) }}</p>
                <div class="d-flex align-center ga-2 mt-1">
                  <v-btn-group border density="compact" divided rounded="lg" variant="outlined">
                    <v-btn icon="mdi-minus" size="x-small" @click="cartStore.decrement(item.product.id)" />
                    <v-btn :text="String(item.quantity)" min-width="30" size="x-small" />
                    <v-btn icon="mdi-plus" size="x-small" @click="cartStore.increment(item.product.id)" />
                  </v-btn-group>
                  <v-btn
                    aria-label="Remove item"
                    icon="mdi-delete-outline"
                    color="error"
                    size="x-small"
                    variant="text"
                    @click="cartStore.removeItem(item.product.id)"
                  />
                </div>
              </div>
            </div>
          </div>
          <v-empty-state
            v-else
            icon="mdi-cart-outline"
            :text="authStore.isAuthenticated ? t('cart.emptyText') : t('auth.cartRequired')"
            :title="t('cart.emptyTitle')"
          />
        </div>

        <!-- Payment & Contact -->
        <div class="d-flex align-center mb-3">
          <v-icon class="mr-2" color="primary" size="small">mdi-credit-card-outline</v-icon>
          <span class="text-subtitle-2 font-weight-bold">{{ t('checkout.paymentAndContact') }}</span>
        </div>

        <!-- Payment Methods -->
        <div class="checkout-section mb-4">
          <v-card variant="outlined" class="pa-4 rounded-lg">
            <span class="text-caption font-weight-bold text-medium-emphasis mb-2 d-block">{{ t('payment.methods') }}</span>
            <v-radio-group v-model="paymentMethod" hide-details>
              <v-radio :label="t('payment.abaPay')" value="aba_pay" color="primary" />
              <v-radio :label="t('payment.creditCard')" value="credit_card" color="primary" />
              <v-radio :label="t('payment.acledaPay')" value="acleda_pay" color="primary" />
              <v-radio :label="t('payment.wingBank')" value="wing_bank" color="primary" />
              <v-radio :label="t('payment.chipMongBank')" value="chip_mong" color="primary" />
              <v-radio :label="t('payment.bankTransfer')" value="bank_transfer" color="primary" />
              <v-radio :label="t('payment.cash')" value="cash" color="primary" />
            </v-radio-group>
            <template v-if="paymentMethod === 'credit_card'">
              <div class="credit-card-wrapper mt-3">
                <div class="card-preview" :class="cardBrand">
                  <div class="card-chip" />
                  <div class="card-brand-icon">
                    <v-icon v-if="cardBrand === 'visa'" size="36">mdi-credit-card</v-icon>
                    <v-icon v-else-if="cardBrand === 'mastercard'" size="36">mdi-credit-card</v-icon>
                    <v-icon v-else size="36">mdi-credit-card-outline</v-icon>
                  </div>
                  <div class="card-number-display">
                    {{ formattedDisplay || '&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull;' }}
                  </div>
                  <div class="card-details">
                    <div class="card-field">
                      <span class="card-field-label">Card Holder</span>
                      <span class="card-field-value">{{ cardholderName || 'Your Name' }}</span>
                    </div>
                    <div class="card-field">
                      <span class="card-field-label">Expires</span>
                      <span class="card-field-value">{{ expiryDate || 'MM/YY' }}</span>
                    </div>
                    <div class="card-field">
                      <span class="card-field-label">CVV</span>
                      <span class="card-field-value">{{ cvv ? '&bull;&bull;&bull;' : '&bull;&bull;&bull;' }}</span>
                    </div>
                  </div>
                </div>

                <v-text-field
                  v-model="cardholderName"
                  class="mb-3"
                  density="comfortable"
                  hide-details
                  :label="t('payment.cardholderName')"
                  :placeholder="t('payment.cardPlaceholder')"
                  prepend-inner-icon="mdi-account-outline"
                  variant="outlined"
                />
                <v-text-field
                  v-model="cardNumber"
                  class="mb-3"
                  density="comfortable"
                  hide-details
                  :label="t('payment.cardNumber')"
                  :placeholder="t('payment.cardNumberPlaceholder')"
                  maxlength="19"
                  prepend-inner-icon="mdi-credit-card-outline"
                  variant="outlined"
                  @input="formatCardNumber"
                />
                <div class="d-flex ga-3">
                  <v-text-field
                    v-model="expiryDate"
                    class="flex-grow-1"
                    density="comfortable"
                    hide-details
                    :label="t('payment.expiryDate')"
                    :placeholder="t('payment.expiryPlaceholder')"
                    maxlength="5"
                    prepend-inner-icon="mdi-calendar-month-outline"
                    variant="outlined"
                    @input="formatExpiry"
                  />
                  <v-text-field
                    v-model="cvv"
                    class="flex-shrink-0"
                    density="comfortable"
                    hide-details
                    :label="t('payment.cvv')"
                    maxlength="4"
                    placeholder="&bull;&bull;&bull;"
                    prepend-inner-icon="mdi-lock-outline"
                    type="password"
                    variant="outlined"
                    style="max-width: 110px"
                  />
                </div>
              </div>
            </template>
            <v-text-field
              v-else-if="paymentMethod !== 'cash'"
              v-model="paymentReference"
              class="mt-3"
              density="comfortable"
              hide-details
              :label="t('payment.reference')"
              prepend-inner-icon="mdi-shield-check-outline"
              variant="outlined"
            />
          </v-card>
        </div>

        <!-- Preferred Contact -->
        <div class="checkout-section mb-4">
          <v-card variant="outlined" class="pa-4 rounded-lg">
            <span class="text-caption font-weight-bold text-medium-emphasis mb-2 d-block">{{ t('contact.preferred') }}</span>
            <v-radio-group v-model="contactMethod" hide-details inline>
              <v-radio :label="t('contact.phoneCall')" value="phone_call" color="primary" />
              <v-radio :label="t('contact.telegram')" value="telegram" color="primary" />
              <v-radio :label="t('contact.whatsapp')" value="whatsapp" color="primary" />
            </v-radio-group>
            <v-text-field
              v-model="contactValue"
              class="mt-3"
              density="comfortable"
              hide-details
              :label="t('contact.placeholder')"
              prepend-inner-icon="mdi-phone-outline"
              variant="outlined"
            />
          </v-card>
        </div>
      </div>

      <div class="cart-footer pa-4">
        <v-alert v-if="checkoutError" class="mb-3" color="error" density="compact" variant="tonal">
          {{ checkoutError }}
        </v-alert>
        <v-alert v-if="checkoutSuccess" class="mb-3" color="success" density="compact" variant="tonal">
          {{ checkoutSuccess }}
        </v-alert>

        <div class="summary-line">
          <span class="text-body-2 text-medium-emphasis">{{ t('cart.subtotal') }}</span>
          <strong>{{ subtotalLabel }}</strong>
        </div>
        <div class="summary-line">
          <span class="text-body-2 text-medium-emphasis">{{ t('cart.tax') }}</span>
          <strong>{{ taxLabel }}</strong>
        </div>
        <div class="summary-line mb-2">
          <span class="text-body-2 text-medium-emphasis">{{ t('cart.shipping') }}</span>
          <strong>{{ shippingLabel }}</strong>
        </div>
        <v-divider class="mb-2" />
        <div class="summary-line mb-3">
          <span class="text-subtitle-1 font-weight-bold">{{ t('cart.total') }}</span>
          <strong class="text-h5">{{ totalLabel }}</strong>
        </div>
        <v-btn
          block
          class="mb-2"
          color="secondary"
          :disabled="cartStore.isEmpty"
          prepend-icon="mdi-arrow-right"
          size="small"
          variant="outlined"
          @click="router.push('/checkout'); drawer = false"
        >
          {{ t('checkoutPage.fullCheckout') }}
        </v-btn>
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

.wishlist-button {
  background: rgba(15, 23, 42, 0.06);
  color: #172033;
}

:global(.v-theme--dark) .wishlist-button {
  background: rgba(229, 237, 245, 0.08);
  color: #e5edf5;
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

.checkout-section :deep(.v-card) {
  background: #ffffff;
}

:global(.v-theme--dark) .checkout-section :deep(.v-card) {
  background: rgba(17, 24, 39, 0.96);
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

.credit-card-wrapper {
  display: flex;
  flex-direction: column;
}

.card-preview {
  position: relative;
  background: linear-gradient(135deg, #1a237e 0%, #283593 40%, #0d47a1 100%);
  border-radius: 14px;
  color: #fff;
  padding: 20px 22px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 8px 28px rgba(13, 71, 161, 0.3);
  margin-bottom: 16px;
  overflow: hidden;
}

.card-preview::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -20%;
  width: 220px;
  height: 220px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
}

.card-preview::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 160px;
  height: 160px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 50%;
}

.card-chip {
  width: 40px;
  height: 30px;
  background: linear-gradient(135deg, #ffd54f, #ffb300);
  border-radius: 5px;
  position: relative;
  z-index: 1;
}

.card-chip::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 18px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.card-brand-icon {
  position: absolute;
  top: 18px;
  right: 20px;
  z-index: 1;
  opacity: 0.9;
}

.card-number-display {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 2.5px;
  font-family: 'Courier New', monospace;
  position: relative;
  z-index: 1;
  margin-top: 8px;
  word-spacing: 6px;
}

.card-details {
  display: flex;
  gap: 24px;
  position: relative;
  z-index: 1;
}

.card-field {
  display: flex;
  flex-direction: column;
}

.card-field-label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  opacity: 0.75;
  margin-bottom: 2px;
}

.card-field-value {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.card-preview.visa .card-brand-icon {
  color: #1a1f71;
}

.card-preview.mastercard .card-brand-icon {
  color: #ff5f00;
}

:global(.v-theme--dark) .card-preview {
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
}

@media (max-width: 599px) {
  .header-search {
    max-width: 190px;
  }
}
</style>
