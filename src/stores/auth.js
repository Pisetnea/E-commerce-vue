import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getProfile, loginCustomer, logoutCustomer, registerCustomer } from '../service/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token') || '')
  const user = ref(null)
  const loading = ref(false)
  const error = ref('')
  const notice = ref('')

  const isAuthenticated = computed(() => Boolean(token.value))
  const customerName = computed(() => user.value?.name ?? user.value?.email ?? 'Customer')

  function setSession(nextToken, nextUser) {
    token.value = nextToken
    user.value = nextUser
    localStorage.setItem('auth_token', nextToken)
  }

  function clearSession() {
    token.value = ''
    user.value = null
    localStorage.removeItem('auth_token')
  }

  function requireAuth(message = 'Please login or register before continuing.') {
    if (isAuthenticated.value) return true

    notice.value = message
    return false
  }

  async function login(credentials) {
    loading.value = true
    error.value = ''

    try {
      const session = await loginCustomer(credentials)

      if (!session.token) {
        throw new Error('The backend did not return an auth token.')
      }

      setSession(session.token, session.user)
      notice.value = ''
      return true
    } catch (requestError) {
      error.value = requestError.response?.data?.message ?? requestError.message ?? 'Login failed.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(payload) {
    loading.value = true
    error.value = ''

    try {
      const session = await registerCustomer(payload)

      if (!session.token) {
        throw new Error('The backend did not return an auth token.')
      }

      setSession(session.token, session.user)
      notice.value = ''
      return true
    } catch (requestError) {
      error.value = requestError.response?.data?.message ?? requestError.message ?? 'Registration failed.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!token.value) return

    try {
      user.value = await getProfile()
    } catch {
      clearSession()
    }
  }

  async function logout() {
    try {
      if (token.value) await logoutCustomer()
    } finally {
      clearSession()
    }
  }

  return {
    token,
    user,
    loading,
    error,
    notice,
    isAuthenticated,
    customerName,
    requireAuth,
    login,
    register,
    fetchProfile,
    logout,
  }
})
