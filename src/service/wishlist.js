import http from './http'

export async function toggleWishlist(productId) {
  const { data } = await http.post('/wishlist/toggle', {
    product_id: productId,
  })

  return data
}
