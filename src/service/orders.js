import http from './http'

export async function createOrder(cartItems, payment = {}) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const tax = subtotal * 0.08
  const shipping = subtotal > 0 && subtotal < 75 ? 7.5 : 0

  const payload = {
    payment_method: payment.method,
    payment_reference: payment.reference,
    subtotal,
    tax,
    shipping,
    total: subtotal + tax + shipping,
    items: cartItems.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    })),
  }

  const { data } = await http.post('/orders', payload)
  return data
}
