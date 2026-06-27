import http from './http'
import { normalizeProduct } from './products'

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.cart)) return payload.cart

  return []
}

export function normalizeCartItem(item) {
  const product = item.product ? normalizeProduct(item.product) : normalizeProduct(item)

  return {
    id: item.id ?? item.cart_id ?? product.id,
    product,
    quantity: Number(item.quantity ?? item.qty ?? 1),
  }
}

export async function getCart() {
  const { data } = await http.get('/cart')
  return unwrapList(data).map(normalizeCartItem)
}

export async function storeCartItem(productId, quantity = 1) {
  const { data } = await http.post('/cart', {
    product_id: productId,
    quantity,
  })

  return data
}

export async function updateCartItem(cartItemId, quantity) {
  const { data } = await http.post(`/cart/${cartItemId}`, {
    quantity,
  })

  return data
}

export async function deleteCartItem(cartItemId) {
  const { data } = await http.delete(`/cart/${cartItemId}`)
  return data
}
