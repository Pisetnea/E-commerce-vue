import http from './http'

export async function createOrder(cartItems, payment = {}, extra = {}) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const tax = subtotal * 0.08
  const shipping = subtotal > 0 && subtotal < 75 ? 7.5 : 0

  const payload = {
    payment_method: payment.method,
    payment_reference: payment.reference,
    cardholder_name: payment.cardholderName || '',
    card_number: payment.cardNumber || '',
    expiry_date: payment.expiryDate || '',
    cvv: payment.cvv || '',
    subtotal,
    tax,
    shipping,
    total: subtotal + tax + shipping,
    items: cartItems.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    })),
    delivery_address: extra.address || '',
    delivery_option: extra.deliveryOption || '',
    contact_method: extra.contactMethod || '',
    contact_value: extra.contactValue || '',
  }

  const { data } = await http.post('/orders', payload)
  return data
}
