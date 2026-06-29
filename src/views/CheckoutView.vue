<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { createOrder } from '../service/orders'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const cartStore = useCartStore()

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

function formatCardNumber(e) {
  const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
  cardNumber.value = raw.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(e) {
  let raw = e.target.value.replace(/\D/g, '').slice(0, 4)
  if (raw.length > 2) raw = raw.slice(0, 2) + '/' + raw.slice(2)
  expiryDate.value = raw
}

async function placeOrder() {
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

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    authStore.notice = t('auth.checkoutRequired')
    router.push({ name: 'login', query: { redirect: '/checkout' } })
    return
  }
  await cartStore.fetchCart()
  if (cartStore.isEmpty) {
    router.push('/')
  }
})
</script>

<template>
  <main class="checkout-page mx-auto max-w-[1240px] px-4 py-8">
    <!-- Breadcrumb -->
    <nav class="mb-6 flex items-center gap-2 text-sm text-slate-500">
      <RouterLink to="/" class="hover:text-teal-600 transition-colors">{{ t('nav.home') }}</RouterLink>
      <v-icon size="small">mdi-chevron-right</v-icon>
      <span class="font-semibold text-slate-900">Checkout</span>
    </nav>

    <div v-if="checkoutSuccess" class="mb-6">
      <v-alert class="mb-4" color="success" density="compact" variant="tonal">
        {{ checkoutSuccess }}
      </v-alert>
      <v-btn color="primary" prepend-icon="mdi-home-outline" rounded="lg" variant="flat" @click="router.push('/')">
        {{ t('nav.home') }}
      </v-btn>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-black text-slate-900">Checkout</h1>
          <p class="mt-1 text-slate-500">{{ t('checkoutPage.subtitle') }}</p>
        </div>
        <div class="secure-badge">
          <v-icon size="small">mdi-lock-check-outline</v-icon>
          <span>{{ t('checkoutPage.secure') }}</span>
        </div>
      </div>

      <div class="grid gap-8 lg:grid-cols-[1fr_400px]">
        <!-- Left: Checkout Form -->
        <div class="flex flex-col gap-6">
          <!-- Delivery Address -->
          <section class="checkout-panel p-6">
            <div class="mb-4 flex items-center gap-2">
              <v-icon color="primary" size="small">mdi-truck-outline</v-icon>
              <h2 class="text-lg font-bold text-slate-900">{{ t('delivery.address') }}</h2>
            </div>
            <template v-if="!address && !showAddressForm">
              <v-btn
                block
                color="secondary"
                variant="tonal"
                prepend-icon="mdi-plus"
                @click="showAddressForm = true"
              >
                {{ t('delivery.addAddress') }}
              </v-btn>
            </template>
            <template v-else-if="showAddressForm || address">
              <v-textarea
                v-model="address"
                auto-grow
                :label="t('delivery.addressPlaceholder')"
                rows="2"
                variant="outlined"
              />
              <div v-if="showAddressForm" class="d-flex ga-2 mt-2">
                <v-btn color="secondary" size="small" variant="flat" @click="showAddressForm = false">
                  {{ address ? t('profile.save') : t('profile.cancel') }}
                </v-btn>
                <v-btn v-if="address" size="small" variant="text" @click="address = ''; showAddressForm = false">
                  {{ t('profile.cancel') }}
                </v-btn>
              </div>
              <div v-else class="d-flex ga-2 mt-2">
                <v-btn
                  size="x-small"
                  variant="text"
                  color="primary"
                  prepend-icon="mdi-pencil"
                  @click="showAddressForm = true"
                >
                  {{ t('delivery.editAddress') }}
                </v-btn>
              </div>
            </template>
            <v-divider class="my-4" />
            <span class="text-caption font-weight-bold text-medium-emphasis">{{ t('delivery.option') }}</span>
            <v-radio-group v-model="deliveryOption" hide-details class="mt-1">
              <v-radio :label="t('delivery.virakBuntham')" value="virak_buntham" color="secondary" />
              <v-radio :label="t('delivery.zandoBikers')" value="zando_bikers" color="secondary" />
            </v-radio-group>
          </section>

          <!-- Payment Method -->
          <section class="checkout-panel p-6">
            <div class="mb-4 flex items-center gap-2">
              <v-icon color="primary" size="small">mdi-credit-card-outline</v-icon>
              <h2 class="text-lg font-bold text-slate-900">{{ t('checkoutPage.paymentMethod') }}</h2>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div
                v-for="method in [
                  { key: 'aba_pay', label: t('payment.abaPay'), icon: 'mdi-credit-card' },
                  { key: 'credit_card', label: t('payment.creditCard'), icon: 'mdi-credit-card-outline' },
                  { key: 'acleda_pay', label: t('payment.acledaPay'), icon: 'mdi-credit-card' },
                  { key: 'wing_bank', label: t('payment.wingBank'), icon: 'mdi-bank-outline' },
                  { key: 'chip_mong', label: t('payment.chipMongBank'), icon: 'mdi-bank-outline' },
                  { key: 'bank_transfer', label: t('payment.bankTransfer'), icon: 'mdi-transfer' },
                  { key: 'cash', label: t('payment.cash'), icon: 'mdi-cash' },
                ]"
                :key="method.key"
                class="payment-method-card rounded-lg border p-3"
                :class="{ 'payment-method-card--selected': paymentMethod === method.key }"
                @click="paymentMethod = method.key"
              >
                <div class="flex items-center gap-3">
                  <v-icon :color="paymentMethod === method.key ? 'secondary' : ''">{{ method.icon }}</v-icon>
                  <span class="text-sm font-semibold text-slate-900">{{ method.label }}</span>
                </div>
              </div>
            </div>

            <!-- Credit Card Form -->
            <template v-if="paymentMethod === 'credit_card'">
              <div class="mt-6">
                <div class="card-preview" :class="cardBrand">
                  <div class="card-chip" />
                  <div class="card-brand-icon">
                    <v-icon v-if="cardBrand === 'visa'" size="36">mdi-credit-card</v-icon>
                    <v-icon v-else-if="cardBrand === 'mastercard'" size="36">mdi-credit-card</v-icon>
                    <v-icon v-else size="36">mdi-credit-card-outline</v-icon>
                  </div>
                  <div class="card-number-display">
                    {{ formattedDisplay || '•••• •••• •••• ••••' }}
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
                      <span class="card-field-value">{{ cvv ? '•••' : '•••' }}</span>
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
                    placeholder="•••"
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
              class="mt-4"
              density="comfortable"
              hide-details
              :label="t('payment.reference')"
              prepend-inner-icon="mdi-shield-check-outline"
              variant="outlined"
            />
          </section>

          <!-- Preferred Contact -->
          <section class="checkout-panel p-6">
            <div class="mb-4 flex items-center gap-2">
              <v-icon color="primary" size="small">mdi-phone-outline</v-icon>
              <h2 class="text-lg font-bold text-slate-900">{{ t('contact.preferred') }}</h2>
            </div>
            <v-radio-group v-model="contactMethod" hide-details inline>
              <v-radio :label="t('contact.phoneCall')" value="phone_call" color="secondary" />
              <v-radio :label="t('contact.telegram')" value="telegram" color="secondary" />
              <v-radio :label="t('contact.whatsapp')" value="whatsapp" color="secondary" />
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
          </section>
        </div>

        <!-- Right: Order Summary Sidebar -->
        <div class="order-summary h-fit lg:sticky lg:top-24">
          <div class="order-summary-header">
            <h3 class="text-lg font-bold">{{ t('checkoutPage.summary') }}</h3>
            <p class="text-sm text-white/70">{{ cartStore.itemCount }} {{ t('shop.items', { count: cartStore.itemCount }) }}</p>
          </div>

          <div class="p-5">
            <!-- Cart Items -->
            <div v-if="cartStore.items.length" class="mb-4">
              <div
                v-for="item in cartStore.items"
                :key="item.product.id"
                class="order-summary-item"
              >
                <v-img
                  :src="item.product.image"
                  class="rounded-lg flex-shrink-0"
                  cover
                  height="52"
                  width="52"
                />
                <div class="min-w-0 flex-grow-1">
                  <p class="text-sm font-semibold text-slate-900 text-truncate">{{ item.product.title }}</p>
                  <p class="text-xs text-slate-500">{{ t('shop.quantity') }}: {{ item.quantity }}</p>
                </div>
                <strong class="text-sm text-slate-900 flex-shrink-0">${{ (item.quantity * item.product.price).toFixed(2) }}</strong>
              </div>
            </div>

            <v-divider class="mb-3" />

            <!-- Totals -->
            <div class="summary-line">
              <span class="text-sm text-slate-500">{{ t('cart.subtotal') }}</span>
              <strong class="text-slate-900">{{ subtotalLabel }}</strong>
            </div>
            <div class="summary-line">
              <span class="text-sm text-slate-500">{{ t('cart.tax') }}</span>
              <strong class="text-slate-900">{{ taxLabel }}</strong>
            </div>
            <div class="summary-line mb-2">
              <span class="text-sm text-slate-500">{{ t('cart.shipping') }}</span>
              <strong class="text-slate-900">{{ shippingLabel }}</strong>
            </div>
            <v-divider class="mb-3" />
            <div class="summary-line mb-4">
              <span class="text-base font-bold text-slate-900">{{ t('cart.total') }}</span>
              <strong class="text-2xl text-slate-900">{{ totalLabel }}</strong>
            </div>

            <v-alert v-if="checkoutError" class="mb-3" color="error" density="compact" variant="tonal">
              {{ checkoutError }}
            </v-alert>

            <v-btn
              block
              color="secondary"
              :disabled="checkoutDisabled"
              :loading="checkoutLoading"
              prepend-icon="mdi-lock-check-outline"
              size="x-large"
              rounded="lg"
              @click="placeOrder"
            >
              {{ t('checkoutPage.placeOrder') }} — {{ totalLabel }}
            </v-btn>

            <p class="mt-3 text-center text-xs text-slate-400">
              <v-icon size="x-small" class="mr-1">mdi-lock-outline</v-icon>
              {{ t('checkoutPage.securePayment') }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </main>
</template>

<style scoped>
.checkout-page :deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-width: 1px;
}
</style>

<style>
/* Dark mode overrides for Tailwind classes used in template */
.v-theme--dark .checkout-page .text-slate-900 {
  color: #e5edf5 !important;
}
.v-theme--dark .checkout-page .text-slate-500,
.v-theme--dark .checkout-page .text-slate-400 {
  color: #94a3b8 !important;
}
.v-theme--dark .checkout-page .checkout-panel,
.v-theme--dark .checkout-page .order-summary {
  background: rgba(17, 24, 39, 0.96);
  border-color: rgba(148, 163, 184, 0.14);
}
</style>
