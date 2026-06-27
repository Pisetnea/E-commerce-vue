import http from './http'

export async function createOrder(cartItems) {
  const payload = {
    items: cartItems.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    })),
  }

  const { data } = await http.post('/orders', payload)
  return data
}
