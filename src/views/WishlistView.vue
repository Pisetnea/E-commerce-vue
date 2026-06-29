<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useProductsStore } from '../stores/products'
import { useWishlistStore } from '../stores/wishlist'
import ProductCard from '../components/shop/ProductCard.vue'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const cartStore = useCartStore()
const productsStore = useProductsStore()
const wishlistStore = useWishlistStore()

const wishlistProducts = computed(() =>
  wishlistStore.productIds
    .map((id) => productsStore.products.find((p) => p.id === id))
    .filter(Boolean),
)

function viewProduct(product) {
  router.push({ name: 'product-detail', params: { id: product.id } })
}

function addToCart(product) {
  if (!authStore.isAuthenticated) {
    authStore.notice = t('auth.cartRequired')
    router.push({ name: 'login', query: { redirect: '/wishlist' } })
    return
  }
  cartStore.addItem(product)
}

function toggleFavorite(product) {
  wishlistStore.toggle(product)
}

onMounted(async () => {
  if (!productsStore.products.length) {
    await productsStore.fetchProducts()
  }
})
</script>

<template>
  <v-container class="wishlist-page py-8" fluid>
    <div class="wishlist-header d-flex align-center justify-space-between mb-6 pa-4 rounded-xl">
      <div>
        <p class="text-overline text-secondary mb-1">{{ t('wishlist.subtitle') }}</p>
        <h2 class="text-h4 font-weight-black">{{ t('wishlist.title') }}</h2>
      </div>
      <v-chip color="error" label variant="tonal">
        {{ t('shop.items', { count: wishlistProducts.length }) }}
      </v-chip>
    </div>

    <v-row v-if="productsStore.loading">
      <v-col v-for="index in 4" :key="index" cols="12" md="3" sm="6">
        <v-skeleton-loader class="rounded-xl" type="image, article, actions" />
      </v-col>
    </v-row>

    <v-empty-state
      v-else-if="!wishlistProducts.length"
      icon="mdi-heart-outline"
      :text="t('wishlist.emptyText')"
      :title="t('wishlist.emptyTitle')"
    >
      <v-btn
        color="primary"
        prepend-icon="mdi-shopping-outline"
        rounded="lg"
        size="large"
        variant="flat"
        @click="router.push('/')"
      >
        {{ t('wishlist.browseProducts') }}
      </v-btn>
    </v-empty-state>

    <v-row v-else>
      <v-col
        v-for="product in wishlistProducts"
        :key="product.id"
        cols="12"
        md="3"
        sm="6"
      >
        <ProductCard
          :favorite="true"
          :favorite-loading="wishlistStore.loadingIds.includes(product.id)"
          :product="product"
          @add="addToCart"
          @favorite="toggleFavorite"
          @view="viewProduct"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.wishlist-page {
  max-width: 1480px;
  min-height: 60vh;
}

.wishlist-header {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.07);
  backdrop-filter: blur(18px);
}

:global(.v-theme--dark) .wishlist-header {
  background: rgba(17, 24, 39, 0.94);
  border-color: rgba(148, 163, 184, 0.14);
}
</style>
