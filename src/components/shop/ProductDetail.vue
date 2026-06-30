<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useCartStore } from '../../stores/cart'
import { useProductsStore } from '../../stores/products'
import { useWishlistStore } from '../../stores/wishlist'

const props = defineProps({
  productId: {
    type: [Number, String],
    required: true,
  },
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const cartStore = useCartStore()
const productsStore = useProductsStore()
const wishlistStore = useWishlistStore()
const loading = ref(false)
const selectedImage = ref(0)
const selectedColor = ref(null)
const selectedSize = ref(null)
const quantity = ref(1)
const tab = ref('specs')

const product = computed(() => productsStore.selectedProduct)
const productImages = computed(() => product.value?.images?.length ? product.value.images : [product.value?.image].filter(Boolean))
const selectedProductImage = computed(() => productImages.value[selectedImage.value] || '')
const productDescription = computed(
  () => product.value?.description || 'A dependable everyday pick from the latest catalog.',
)
const stockColor = computed(() => (product.value?.stock > 10 ? 'success' : 'warning'))
const isFavorite = computed(() => (product.value ? wishlistStore.isFavorite(product.value.id) : false))
const productHighlights = computed(() => [
  { icon: 'mdi-truck-fast-outline', title: 'Fast delivery', text: 'Local delivery options available' },
  { icon: 'mdi-shield-check-outline', title: 'Secure checkout', text: 'Protected account payments' },
  { icon: 'mdi-refresh', title: 'Easy updates', text: 'Cart syncs with your account' },
])

watch(
  product,
  (nextProduct) => {
    if (!nextProduct) return

    selectedImage.value = 0
    selectedColor.value = nextProduct.colors?.[0] ?? null
    selectedSize.value = nextProduct.sizes?.[0] ?? null
    quantity.value = 1
  },
  { immediate: true },
)

watch(
  () => props.productId,
  (productId) => {
    productsStore.fetchProduct(productId)
  },
)

async function addToCart() {
  if (!product.value) return
  if (!authStore.isAuthenticated) {
    requestLogin(t('auth.cartRequired'))
    return
  }

  loading.value = true
  try {
    await cartStore.addItem(product.value, quantity.value)
  } finally {
    loading.value = false
  }
}

function decrementQuantity() {
  quantity.value = Math.max(1, Number(quantity.value || 1) - 1)
}

function incrementQuantity() {
  const maxQuantity = product.value?.stock > 0 ? product.value.stock : 99
  quantity.value = Math.min(maxQuantity, Number(quantity.value || 1) + 1)
}

function clampQuantity() {
  const maxQuantity = product.value?.stock > 0 ? product.value.stock : 99
  quantity.value = Math.min(maxQuantity, Math.max(1, Number(quantity.value || 1)))
}

function requestLogin(message) {
  authStore.notice = message
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

function toggleFavorite() {
  if (!product.value) return
  if (!authStore.isAuthenticated) {
    requestLogin(t('auth.wishlistRequired'))
    return
  }

  wishlistStore.toggle(product.value)
}

onMounted(() => {
  productsStore.fetchProduct(props.productId)
})
</script>

<template>
  <v-container class="product-detail-page py-8">
    <nav v-if="product" class="detail-breadcrumb mb-5">
      <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
      <v-icon icon="mdi-chevron-right" size="16" />
      <RouterLink :to="{ name: 'home', query: { category: product.category } }">
        {{ product.category }}
      </RouterLink>
      <v-icon icon="mdi-chevron-right" size="16" />
      <span>{{ product.title }}</span>
    </nav>

    <v-row v-if="productsStore.detailLoading">
      <v-col cols="12" md="7">
        <v-skeleton-loader type="image" />
      </v-col>
      <v-col cols="12" md="5">
        <v-skeleton-loader type="article, actions" />
      </v-col>
    </v-row>

    <v-alert v-else-if="productsStore.error" color="error" variant="tonal">
      {{ productsStore.error }}
    </v-alert>

    <v-row v-else-if="product" align="start" class="product-hero">
      <v-col cols="12" md="7">
        <v-sheet class="product-gallery pa-3" rounded="xl">
          <v-img
            :alt="product.title"
            aspect-ratio="1.12"
            cover
            class="main-product-image"
            rounded="lg"
            :src="selectedProductImage"
          >
            <template #placeholder>
              <v-skeleton-loader class="h-100" type="image" />
            </template>
            <template #error>
              <div class="image-fallback">
                <v-icon icon="mdi-image-off-outline" size="56" />
                <strong>{{ product.title }}</strong>
                <span>{{ product.category }}</span>
              </div>
            </template>
          </v-img>
        </v-sheet>

        <v-slide-group
          v-if="productImages.length > 1"
          v-model="selectedImage"
          class="mt-4"
          mandatory
          selected-class="thumbnail-active"
        >
          <v-slide-group-item
            v-for="(image, index) in productImages"
            :key="image"
            v-slot="{ isSelected, selectedClass, toggle }"
            :value="index"
          >
            <v-img
              :class="['thumbnail mr-3', selectedClass]"
              cover
              height="88"
              rounded="xl"
              :src="image"
              width="88"
              @click="toggle"
            >
              <div v-if="isSelected" class="h-100 border border-primary rounded-lg" />
              <template #error>
                <div class="thumbnail-fallback">
                  <v-icon icon="mdi-image-off-outline" size="22" />
                </div>
              </template>
            </v-img>
          </v-slide-group-item>
        </v-slide-group>

        <div class="highlight-grid mt-4">
          <div v-for="item in productHighlights" :key="item.title" class="highlight-item">
            <v-icon :icon="item.icon" size="22" />
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.text }}</span>
            </div>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="5">
        <v-sheet class="detail-panel pa-6" rounded="xl">
          <div class="d-flex align-center justify-space-between ga-3">
            <div class="d-flex align-center ga-2 flex-wrap">
              <v-chip color="secondary" label size="small" variant="tonal">
                {{ product.category }}
              </v-chip>
              <v-chip :color="stockColor" label size="small" variant="tonal">
                {{ t('shop.inStock', { count: product.stock }) }}
              </v-chip>
            </div>
            <v-btn
              :aria-label="t('shop.favorite')"
              :color="isFavorite ? 'error' : 'primary'"
              :icon="isFavorite ? 'mdi-heart' : 'mdi-heart-outline'"
              :loading="wishlistStore.loadingIds.includes(product.id)"
              variant="tonal"
              @click="toggleFavorite"
            />
          </div>

          <h1 class="product-heading text-balance mt-5 mb-2">{{ product.title }}</h1>
          <p class="text-body-1 text-medium-emphasis mb-4">{{ productDescription }}</p>

          <div class="rating-row mb-5">
            <div class="d-flex align-center ga-2">
              <v-rating
                :model-value="product.rating"
                color="amber"
                density="compact"
                half-increments
                readonly
                size="20"
              />
              <span class="text-body-2 text-medium-emphasis">{{ t('shop.reviews', { count: product.reviews }) }}</span>
            </div>
            <span class="text-caption text-medium-emphasis">SKU #{{ product.id }}</span>
          </div>

          <div class="price-panel mb-6">
            <span class="price-value">${{ product.price.toFixed(2) }}</span>
            <span
              v-if="product.originalPrice > product.price"
              class="text-body-1 text-medium-emphasis text-decoration-line-through"
            >
              ${{ product.originalPrice.toFixed(2) }}
            </span>
            <span class="text-caption text-medium-emphasis">Tax calculated at checkout</span>
          </div>

          <p class="text-subtitle-2 font-weight-bold mb-2">{{ t('shop.color') }}</p>
          <v-chip-group v-model="selectedColor" class="option-group mb-5" mandatory>
            <v-chip v-for="color in product.colors" :key="color" filter :value="color">
              {{ color }}
            </v-chip>
          </v-chip-group>

          <p class="text-subtitle-2 font-weight-bold mb-2">{{ t('shop.size') }}</p>
          <v-chip-group v-model="selectedSize" class="option-group mb-5" mandatory>
            <v-chip v-for="size in product.sizes" :key="size" filter :value="size">
              {{ size }}
            </v-chip>
          </v-chip-group>

          <div class="purchase-row mb-4">
            <div class="quantity-stepper">
              <span>{{ t('shop.quantity') }}</span>
              <div class="d-flex align-center">
                <v-btn
                  aria-label="Decrease quantity"
                  icon="mdi-minus"
                  size="small"
                  variant="text"
                  @click="decrementQuantity"
                />
                <input
                  v-model.number="quantity"
                  aria-label="Quantity"
                  min="1"
                  type="number"
                  @blur="clampQuantity"
                >
                <v-btn
                  aria-label="Increase quantity"
                  icon="mdi-plus"
                  size="small"
                  variant="text"
                  @click="incrementQuantity"
                />
              </div>
            </div>
            <div class="mini-total">
              <span>Total</span>
              <strong>${{ (product.price * quantity).toFixed(2) }}</strong>
            </div>
          </div>

          <v-btn
            block
            class="add-cart-button"
            color="primary"
            :loading="loading"
            prepend-icon="mdi-cart-plus"
            size="x-large"
            @click="addToCart"
          >
            {{ t('shop.addToCart') }}
          </v-btn>

          <v-btn
            block
            class="mt-3"
            color="secondary"
            prepend-icon="mdi-arrow-left"
            variant="tonal"
            @click="router.push({ name: 'home', query: { category: product.category } })"
          >
            Back to {{ product.category }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>

    <v-sheet v-if="product" class="detail-tabs mt-8" rounded="xl">
      <v-tabs v-model="tab" color="primary">
        <v-tab value="specs">{{ t('shop.specifications') }}</v-tab>
        <v-tab value="shipping">{{ t('shop.shippingPolicy') }}</v-tab>
        <v-tab value="reviews">{{ t('shop.customerReviews') }}</v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="tab" class="pa-6">
        <v-window-item value="specs">
          <v-row>
            <v-col cols="12" sm="4">
              <p class="text-medium-emphasis mb-1">Material</p>
              <p class="font-weight-bold">Premium technical blend</p>
            </v-col>
            <v-col cols="12" sm="4">
              <p class="text-medium-emphasis mb-1">Care</p>
              <p class="font-weight-bold">Machine washable</p>
            </v-col>
            <v-col cols="12" sm="4">
              <p class="text-medium-emphasis mb-1">Warranty</p>
              <p class="font-weight-bold">12 months</p>
            </v-col>
          </v-row>
        </v-window-item>

        <v-window-item value="shipping">
          <p class="text-body-1 mb-0">
            Free standard shipping on orders over $75. Express options and local pickup can be connected
            to your backend checkout rules.
          </p>
        </v-window-item>

        <v-window-item value="reviews">
          <v-list lines="two">
            <v-list-item
              prepend-avatar="https://i.pravatar.cc/80?img=12"
              subtitle="Great fit, fast delivery, and the photos were accurate."
              title="Maya R."
            />
            <v-list-item
              prepend-avatar="https://i.pravatar.cc/80?img=32"
              subtitle="The quality feels premium. I would buy this again."
              title="Jon K."
            />
          </v-list>
        </v-window-item>
      </v-window>
    </v-sheet>
  </v-container>
</template>

<style scoped>
.product-detail-page {
  max-width: 1320px;
}

.detail-breadcrumb {
  align-items: center;
  color: rgba(100, 116, 139, 0.95);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.88rem;
  font-weight: 700;
  gap: 0.35rem;
}

.detail-breadcrumb a {
  color: #0f766e;
}

.product-hero {
  row-gap: 1.25rem;
}

.product-gallery,
.detail-panel,
.detail-tabs {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 22px 54px rgba(15, 23, 42, 0.08);
}

.product-gallery {
  overflow: hidden;
}

.main-product-image {
  background:
    radial-gradient(circle at 20% 20%, rgba(13, 148, 136, 0.12), transparent 18rem),
    linear-gradient(135deg, #f8fafc, #e2e8f0);
}

.image-fallback,
.thumbnail-fallback {
  align-items: center;
  background:
    radial-gradient(circle at 18% 18%, rgba(13, 148, 136, 0.16), transparent 16rem),
    linear-gradient(135deg, #f8fafc, #e2e8f0);
  color: #475569;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  height: 100%;
  justify-content: center;
  padding: 1rem;
  text-align: center;
}

.image-fallback strong {
  color: #172033;
  font-size: clamp(1.8rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 1;
}

.image-fallback span {
  font-weight: 700;
}

.highlight-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.highlight-item {
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  display: flex;
  gap: 0.7rem;
  padding: 0.95rem;
}

.highlight-item .v-icon {
  color: #0f766e;
  flex: 0 0 auto;
}

.highlight-item strong,
.highlight-item span {
  display: block;
}

.highlight-item strong {
  color: #172033;
  font-size: 0.9rem;
  line-height: 1.2;
}

.highlight-item span {
  color: #64748b;
  font-size: 0.78rem;
  margin-top: 0.18rem;
}

.detail-panel {
  backdrop-filter: blur(18px);
  position: sticky;
  top: 96px;
}

.product-heading {
  color: #172033;
  font-size: clamp(2rem, 4vw, 3.45rem);
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.02;
}

.rating-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
}

.price-panel {
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.1), rgba(249, 115, 22, 0.08));
  border: 1px solid rgba(13, 148, 136, 0.14);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 1rem;
}

.price-value {
  color: #172033;
  font-size: 2rem;
  font-weight: 950;
  line-height: 1;
}

.option-group :deep(.v-chip) {
  border-radius: 999px;
  min-height: 38px;
  padding-inline: 14px;
}

.purchase-row {
  align-items: stretch;
  display: grid;
  gap: 0.8rem;
  grid-template-columns: minmax(0, 1fr) auto;
}

.quantity-stepper,
.mini-total {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 12px;
  padding: 0.65rem 0.8rem;
}

.quantity-stepper > span,
.mini-total span {
  color: #64748b;
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
}

.quantity-stepper input {
  background: transparent;
  border: 0;
  color: #172033;
  font-size: 1.1rem;
  font-weight: 900;
  max-width: 54px;
  outline: 0;
  text-align: center;
}

.mini-total {
  min-width: 132px;
}

.mini-total strong {
  color: #172033;
  display: block;
  font-size: 1.15rem;
  font-weight: 950;
}

.thumbnail {
  border: 1px solid rgba(148, 163, 184, 0.22);
  cursor: pointer;
  opacity: 0.72;
  transition:
    opacity 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
}

.thumbnail:hover,
.thumbnail-active {
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
  opacity: 1;
  transform: translateY(-3px);
}

.add-cart-button {
  box-shadow: 0 16px 34px rgba(31, 41, 55, 0.22);
}

:global(.v-theme--dark) .product-gallery,
:global(.v-theme--dark) .detail-panel,
:global(.v-theme--dark) .detail-tabs {
  background: rgba(17, 24, 39, 0.94);
  border-color: rgba(148, 163, 184, 0.14);
}

:global(.v-theme--dark) .detail-breadcrumb,
:global(.v-theme--dark) .highlight-item span,
:global(.v-theme--dark) .quantity-stepper > span,
:global(.v-theme--dark) .mini-total span {
  color: #94a3b8;
}

:global(.v-theme--dark) .product-heading,
:global(.v-theme--dark) .price-value,
:global(.v-theme--dark) .highlight-item strong,
:global(.v-theme--dark) .quantity-stepper input,
:global(.v-theme--dark) .mini-total strong,
:global(.v-theme--dark) .image-fallback strong {
  color: #e5edf5;
}

:global(.v-theme--dark) .main-product-image,
:global(.v-theme--dark) .image-fallback,
:global(.v-theme--dark) .thumbnail-fallback {
  background:
    radial-gradient(circle at 20% 20%, rgba(45, 212, 191, 0.14), transparent 18rem),
    linear-gradient(135deg, #111827, #1e293b);
  color: #94a3b8;
}

:global(.v-theme--dark) .highlight-item,
:global(.v-theme--dark) .quantity-stepper,
:global(.v-theme--dark) .mini-total {
  background: rgba(30, 41, 59, 0.72);
  border-color: rgba(148, 163, 184, 0.14);
}

:global(.v-theme--dark) .price-panel {
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.12), rgba(251, 146, 60, 0.09));
  border-color: rgba(45, 212, 191, 0.18);
}

:global(.v-theme--dark) .thumbnail {
  border-color: rgba(148, 163, 184, 0.14);
}

@media (max-width: 959px) {
  .detail-panel {
    position: static;
  }

  .highlight-grid,
  .purchase-row {
    grid-template-columns: 1fr;
  }
}
</style>
