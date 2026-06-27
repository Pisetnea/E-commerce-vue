import http from './http'

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.products)) return payload.products

  return []
}

function unwrapItem(payload) {
  return payload?.data?.data ?? payload?.data ?? payload?.product ?? payload
}

export function normalizeProduct(product) {
  const images = product.images?.length
    ? product.images.map((image) => image.url ?? image.path ?? image)
    : [product.image_url ?? product.image ?? product.thumbnail].filter(Boolean)

  return {
    id: product.id,
    title: product.title ?? product.name ?? 'Untitled product',
    category: product.category?.name ?? product.category_name ?? product.category ?? 'General',
    price: Number(product.price ?? product.sale_price ?? 0),
    originalPrice: Number(product.original_price ?? product.compare_at_price ?? product.price ?? 0),
    rating: Number(product.rating ?? product.average_rating ?? 0),
    reviews: Number(product.reviews_count ?? product.reviews ?? 0),
    badge: product.badge ?? product.discount_label ?? '',
    stock: Number(product.stock ?? product.quantity ?? 0),
    colors: product.colors?.length ? product.colors : ['Default'],
    sizes: product.sizes?.length ? product.sizes : ['One size'],
    image: product.image_url ?? product.image ?? product.thumbnail ?? images[0] ?? '',
    images,
    description: product.description ?? product.short_description ?? '',
    raw: product,
  }
}

export async function getProducts(params = {}) {
  const { data } = await http.get('/products', { params })
  return unwrapList(data).map(normalizeProduct)
}

export async function searchProducts(searchTerm) {
  const { data } = await http.get('/products/search', {
    params: {
      q: searchTerm,
      search: searchTerm,
    },
  })

  return unwrapList(data).map(normalizeProduct)
}

export async function getProduct(productId) {
  const { data } = await http.get(`/products/${productId}`)
  return normalizeProduct(unwrapItem(data))
}
