<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useCartStore } from '../../stores/cart'
import { useProductsStore } from '../../stores/products'
import { useWishlistStore } from '../../stores/wishlist'
import HeroSlideshow from './HeroSlideshow.vue'
import ProductCard from './ProductCard.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const cartStore = useCartStore()
const productsStore = useProductsStore()
const wishlistStore = useWishlistStore()

const selectedCategories = ref([])
const sort = ref('Featured')
const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Top Rated']

watch(
  () => route.query.category,
  (category) => {
    selectedCategories.value = category ? [String(category)] : []
  },
  { immediate: true },
)

const filteredProducts = computed(() => {
  const visible = selectedCategories.value.length
    ? productsStore.products.filter((product) => selectedCategories.value.includes(product.category))
    : [...productsStore.products]

  if (sort.value === 'Price: Low to High') return visible.sort((a, b) => a.price - b.price)
  if (sort.value === 'Price: High to Low') return visible.sort((a, b) => b.price - a.price)
  if (sort.value === 'Top Rated') return visible.sort((a, b) => b.rating - a.rating)

  return visible
})

function viewProduct(product) {
  router.push({ name: 'product-detail', params: { id: product.id } })
}

function resetCategories() {
  selectedCategories.value = []
  router.push({ name: 'home' })
}

function requestLogin(message) {
  authStore.notice = message
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

function addToCart(product) {
  if (!authStore.isAuthenticated) {
    requestLogin(t('auth.cartRequired'))
    return
  }

  cartStore.addItem(product)
}

function toggleFavorite(product) {
  if (!authStore.isAuthenticated) {
    requestLogin(t('auth.wishlistRequired'))
    return
  }

  wishlistStore.toggle(product)
}

onMounted(() => {
  productsStore.fetchCategories()
  productsStore.fetchProducts()
})
</script>

<template>
  <v-container class="catalog-page py-8" fluid>
    <HeroSlideshow />

    <v-row>
      <v-col cols="12" lg="3">
        <v-sheet class="filter-panel pa-4" rounded="xl">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h6 font-weight-bold">{{ t('shop.filters') }}</h2>
            <v-btn
              :disabled="!selectedCategories.length"
              size="small"
              :text="t('shop.reset')"
              variant="text"
              @click="resetCategories"
            />
          </div>

          <v-select
            v-model="sort"
            class="mb-4"
            density="comfortable"
            hide-details
            :items="sortOptions"
            :label="t('shop.sortBy')"
            prepend-inner-icon="mdi-sort"
            variant="outlined"
          />

          <v-expansion-panels multiple variant="accordion">
            <v-expansion-panel :title="t('shop.category')">
              <v-expansion-panel-text>
                <v-checkbox
                  v-for="category in productsStore.categories"
                  :key="category"
                  v-model="selectedCategories"
                  color="primary"
                  density="compact"
                  hide-details
                  :label="category"
                  :value="category"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel :title="t('shop.priceRange')">
              <v-expansion-panel-text>
                <v-range-slider
                  color="primary"
                  density="compact"
                  disabled
                  hide-details
                  :max="250"
                  :min="0"
                  :model-value="[25, 200]"
                  thumb-label
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-sheet>
      </v-col>

      <v-col cols="12" lg="9">
        <div class="catalog-toolbar d-flex align-center justify-space-between mb-4 pa-3">
          <div>
            <p class="text-overline text-secondary mb-1">{{ t('shop.catalog') }}</p>
            <h2 class="text-h4 font-weight-black">{{ t('shop.shopProducts') }}</h2>
          </div>
          <v-chip color="primary" label variant="tonal">{{ t('shop.items', { count: filteredProducts.length }) }}</v-chip>
        </div>

        <v-alert
          v-if="productsStore.error"
          class="mb-4"
          closable
          color="error"
          variant="tonal"
          @click:close="productsStore.error = ''"
        >
          {{ productsStore.error }}
        </v-alert>

        <v-row v-if="productsStore.loading">
          <v-col v-for="index in 8" :key="index" cols="12" md="3" sm="6">
            <v-skeleton-loader class="rounded-xl" type="image, article, actions" />
          </v-col>
        </v-row>

        <v-empty-state
          v-else-if="!filteredProducts.length"
          icon="mdi-package-variant-closed"
          :text="t('shop.noProductsText')"
          :title="t('shop.noProducts')"
        />

        <v-row v-else>
          <v-col v-for="product in filteredProducts" :key="product.id" cols="12" md="3" sm="6">
            <ProductCard
              :favorite="wishlistStore.isFavorite(product.id)"
              :favorite-loading="wishlistStore.loadingIds.includes(product.id)"
              :product="product"
              @add="addToCart"
              @favorite="toggleFavorite"
              @view="viewProduct"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.catalog-page {
  max-width: 1480px;
}

.filter-panel,
.catalog-toolbar {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.07);
  backdrop-filter: blur(18px);
}

.filter-panel {
  position: sticky;
  top: 104px;
}

.catalog-toolbar {
  border-radius: 18px;
}

@media (max-width: 1279px) {
  .filter-panel {
    position: static;
  }
}
</style>
