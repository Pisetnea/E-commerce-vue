import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getCategories } from '../service/categories'
import { getProduct, getProducts, searchProducts } from '../service/products'

export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const categoryOptions = ref([])
  const selectedProduct = ref(null)
  const loading = ref(false)
  const detailLoading = ref(false)
  const error = ref('')
  const search = ref('')

  const categories = computed(() => {
    if (categoryOptions.value.length) return categoryOptions.value.map((category) => category.name)

    const names = products.value.map((product) => product.category).filter(Boolean)
    return [...new Set(names)]
  })

  async function fetchProducts(params = {}) {
    loading.value = true
    error.value = ''

    try {
      products.value = search.value.trim()
        ? await searchProducts(search.value.trim())
        : await getProducts(params)
    } catch (requestError) {
      error.value = requestError.response?.data?.message ?? 'Unable to load products.'
      products.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchProduct(productId) {
    detailLoading.value = true
    error.value = ''

    try {
      selectedProduct.value = await getProduct(productId)
    } catch (requestError) {
      error.value = requestError.response?.data?.message ?? 'Unable to load product details.'
      selectedProduct.value = null
    } finally {
      detailLoading.value = false
    }
  }

  async function fetchCategories() {
    try {
      categoryOptions.value = await getCategories()
    } catch {
      categoryOptions.value = []
    }
  }

  async function setSearch(value) {
    search.value = value
    await fetchProducts()
  }

  return {
    products,
    categoryOptions,
    selectedProduct,
    loading,
    detailLoading,
    error,
    search,
    categories,
    fetchProducts,
    fetchProduct,
    fetchCategories,
    setSearch,
  }
})
