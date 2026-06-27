import http from './http'

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.categories)) return payload.categories

  return []
}

export async function getCategories() {
  const { data } = await http.get('/categories')

  return unwrapList(data).map((category) => ({
    id: category.id,
    name: category.name ?? category.title ?? category.category_name ?? 'Category',
    raw: category,
  }))
}
