import { ref } from 'vue'
import { defineStore } from 'pinia'
import { toggleWishlist } from '../service/wishlist'

export const useWishlistStore = defineStore('wishlist', () => {
  const productIds = ref([])
  const loadingIds = ref([])
  const error = ref('')

  function isFavorite(productId) {
    return productIds.value.includes(productId)
  }

  async function toggle(product) {
    if (!product?.id || loadingIds.value.includes(product.id)) return

    loadingIds.value.push(product.id)
    error.value = ''

    const wasFavorite = isFavorite(product.id)
    productIds.value = wasFavorite
      ? productIds.value.filter((id) => id !== product.id)
      : [...productIds.value, product.id]

    try {
      await toggleWishlist(product.id)
    } catch (requestError) {
      productIds.value = wasFavorite
        ? [...productIds.value, product.id]
        : productIds.value.filter((id) => id !== product.id)
      error.value = requestError.response?.data?.message ?? 'Unable to update wishlist.'
    } finally {
      loadingIds.value = loadingIds.value.filter((id) => id !== product.id)
    }
  }

  return { productIds, loadingIds, error, isFavorite, toggle }
})
