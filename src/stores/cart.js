import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { deleteCartItem, getCart, storeCartItem, updateCartItem } from '../service/cart'
import { useAuthStore } from './auth'

export const useCartStore = defineStore('cart', () => {
  const authStore = useAuthStore()
  const items = ref([])
  const loading = ref(false)
  const error = ref('')

  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  )

  async function fetchCart() {
    if (!authStore.isAuthenticated) return

    loading.value = true
    error.value = ''

    try {
      items.value = await getCart()
    } catch (requestError) {
      error.value = requestError.response?.data?.message ?? 'Unable to load cart.'
    } finally {
      loading.value = false
    }
  }

  async function addItem(product, quantity = 1) {
    if (!authStore.requireAuth('Please login or register before adding products to cart.')) {
      return false
    }

    const existing = items.value.find((item) => item.product.id === product.id)

    if (existing) {
      existing.quantity += quantity
      await syncUpdate(existing)
      return true
    }

    const cartItem = { id: product.id, product, quantity }
    items.value.push(cartItem)

    try {
      const response = await storeCartItem(product.id, quantity)
      cartItem.id = response?.data?.id ?? response?.id ?? cartItem.id
    } catch (requestError) {
      error.value = requestError.response?.data?.message ?? 'Unable to sync cart item.'
    }

    return true
  }

  async function increment(productId) {
    if (!authStore.requireAuth('Please login or register before updating your cart.')) return

    const item = items.value.find((entry) => entry.product.id === productId)
    if (!item) return

    item.quantity += 1
    await syncUpdate(item)
  }

  async function decrement(productId) {
    if (!authStore.requireAuth('Please login or register before updating your cart.')) return

    const item = items.value.find((entry) => entry.product.id === productId)
    if (!item) return

    if (item.quantity <= 1) {
      await removeItem(productId)
      return
    }

    item.quantity -= 1
    await syncUpdate(item)
  }

  async function removeItem(productId) {
    if (!authStore.requireAuth('Please login or register before updating your cart.')) return

    const item = items.value.find((entry) => entry.product.id === productId)
    items.value = items.value.filter((entry) => entry.product.id !== productId)

    if (!item) return

    try {
      await deleteCartItem(item.id)
    } catch (requestError) {
      error.value = requestError.response?.data?.message ?? 'Unable to remove cart item.'
    }
  }

  function clearCart() {
    items.value = []
  }

  async function syncUpdate(item) {
    try {
      await updateCartItem(item.id, item.quantity)
    } catch (requestError) {
      error.value = requestError.response?.data?.message ?? 'Unable to update cart item.'
    }
  }

  return {
    items,
    loading,
    error,
    itemCount,
    subtotal,
    fetchCart,
    addItem,
    increment,
    decrement,
    removeItem,
    clearCart,
  }
})
