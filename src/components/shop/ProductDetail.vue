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
const stockColor = computed(() => (product.value?.stock > 10 ? 'success' : 'warning'))
const isFavorite = computed(() => (product.value ? wishlistStore.isFavorite(product.value.id) : false))

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
  await new Promise((resolve) => setTimeout(resolve, 450))
  cartStore.addItem(product.value, quantity.value)
  loading.value = false
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

    <v-row v-else-if="product">
      <v-col cols="12" md="7">
        <v-sheet class="product-gallery pa-2" rounded="xl">
          <v-img
            :alt="product.title"
            aspect-ratio="1"
            cover
            rounded="xl"
            :src="productImages[selectedImage]"
          >
            <template #placeholder>
              <v-skeleton-loader class="h-100" type="image" />
            </template>
          </v-img>
        </v-sheet>

        <v-slide-group v-model="selectedImage" class="mt-4" mandatory selected-class="thumbnail-active">
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
            </v-img>
          </v-slide-group-item>
        </v-slide-group>
      </v-col>

      <v-col cols="12" md="5">
        <v-sheet class="detail-panel pa-6" rounded="xl">
          <div class="d-flex align-center justify-space-between ga-3">
            <v-chip :color="stockColor" label size="small" variant="tonal">
              {{ t('shop.inStock', { count: product.stock }) }}
            </v-chip>
            <v-btn
              :aria-label="t('shop.favorite')"
              :color="isFavorite ? 'error' : 'primary'"
              :icon="isFavorite ? 'mdi-heart' : 'mdi-heart-outline'"
              :loading="wishlistStore.loadingIds.includes(product.id)"
              variant="tonal"
              @click="toggleFavorite"
            />
          </div>

          <h1 class="text-h3 font-weight-black text-balance mt-4 mb-2">{{ product.title }}</h1>
          <p class="text-body-1 text-medium-emphasis mb-4">{{ product.description }}</p>

          <div class="d-flex align-center ga-2 mb-5">
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

          <div class="d-flex align-end ga-3 mb-6">
            <span class="text-h4 font-weight-black">${{ product.price.toFixed(2) }}</span>
            <span
              v-if="product.originalPrice > product.price"
              class="text-h6 text-medium-emphasis text-decoration-line-through"
            >
              ${{ product.originalPrice.toFixed(2) }}
            </span>
          </div>

          <p class="text-subtitle-2 font-weight-bold mb-2">{{ t('shop.color') }}</p>
          <v-chip-group v-model="selectedColor" class="mb-5" mandatory>
            <v-chip v-for="color in product.colors" :key="color" filter :value="color">
              {{ color }}
            </v-chip>
          </v-chip-group>

          <p class="text-subtitle-2 font-weight-bold mb-2">{{ t('shop.size') }}</p>
          <v-chip-group v-model="selectedSize" class="mb-5" mandatory>
            <v-chip v-for="size in product.sizes" :key="size" filter :value="size">
              {{ size }}
            </v-chip>
          </v-chip-group>

          <v-text-field
            v-model.number="quantity"
            class="mb-4"
            density="comfortable"
            hide-details
            :label="t('shop.quantity')"
            max-width="180"
            min="1"
            type="number"
            variant="outlined"
          />

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

.product-gallery,
.detail-panel,
.detail-tabs {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 22px 54px rgba(15, 23, 42, 0.08);
}

.product-gallery {
  overflow: hidden;
}

.detail-panel {
  backdrop-filter: blur(18px);
  position: sticky;
  top: 96px;
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

@media (max-width: 959px) {
  .detail-panel {
    position: static;
  }
}
</style>
