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
  const isEmpty = computed(() => items.value.length === 0)
  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  )
  const tax = computed(() => subtotal.value * 0.08)
  const shipping = computed(() => (subtotal.value > 0 && subtotal.value < 75 ? 7.5 : 0))
  const total = computed(() => subtotal.value + tax.value + shipping.value)

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
      const previousQuantity = existing.quantity
      existing.quantity += Math.max(1, quantity)
      await syncUpdate(existing)
      if (error.value) existing.quantity = previousQuantity
      return true
    }

    const cartItem = { id: product.id, product, quantity: Math.max(1, quantity) }
    items.value.push(cartItem)

    try {
      const response = await storeCartItem(product.id, cartItem.quantity)
      cartItem.id = response?.data?.id ?? response?.id ?? cartItem.id
    } catch (requestError) {
      error.value = requestError.response?.data?.message ?? 'Unable to sync cart item.'
      items.value = items.value.filter((item) => item !== cartItem)
      return false
    }

    return true
  }

  async function increment(productId) {
    if (!authStore.requireAuth('Please login or register before updating your cart.')) return

    const item = items.value.find((entry) => entry.product.id === productId)
    if (!item) return

    const previousQuantity = item.quantity
    item.quantity += 1
    await syncUpdate(item)
    if (error.value) item.quantity = previousQuantity
  }

  async function decrement(productId) {
    if (!authStore.requireAuth('Please login or register before updating your cart.')) return

    const item = items.value.find((entry) => entry.product.id === productId)
    if (!item) return

    if (item.quantity <= 1) {
      await removeItem(productId)
      return
    }

    const previousQuantity = item.quantity
    item.quantity -= 1
    await syncUpdate(item)
    if (error.value) item.quantity = previousQuantity
  }

  async function removeItem(productId) {
    if (!authStore.requireAuth('Please login or register before updating your cart.')) return

    const item = items.value.find((entry) => entry.product.id === productId)
    const previousItems = [...items.value]
    items.value = items.value.filter((entry) => entry.product.id !== productId)

    if (!item) return

    try {
      await deleteCartItem(item.id)
    } catch (requestError) {
      error.value = requestError.response?.data?.message ?? 'Unable to remove cart item.'
      items.value = previousItems
    }
  }

  function clearCart() {
    items.value = []
  }

  async function syncUpdate(item) {
    error.value = ''

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
    isEmpty,
    subtotal,
    tax,
    shipping,
    total,
    fetchCart,
    addItem,
    increment,
    decrement,
    removeItem,
    clearCart,
  }
})
