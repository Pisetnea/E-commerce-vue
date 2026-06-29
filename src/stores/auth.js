import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getProfile, loginCustomer, logoutCustomer, registerCustomer, updateProfile } from '../service/auth'

const AVATAR_KEY = 'auth_avatar_url'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token') || '')
  const user = ref(null)
  const localAvatar = ref(localStorage.getItem(AVATAR_KEY) || '')
  const loading = ref(false)
  const initialized = ref(false)
  const error = ref('')
  const notice = ref('')

  const isAuthenticated = computed(() => Boolean(token.value))
  const customerName = computed(() => user.value?.name ?? user.value?.email ?? 'Customer')
  const initials = computed(() => customerName.value.slice(0, 2).toUpperCase())
  const avatarUrl = computed(
    () => user.value?.avatar_url ?? user.value?.avatar ?? user.value?.profile_photo_url ?? localAvatar.value,
  )

  function getErrorMessage(requestError, fallback) {
    const response = requestError.response?.data
    const validationErrors = response?.errors

    if (validationErrors && typeof validationErrors === 'object') {
      return Object.values(validationErrors).flat().filter(Boolean).join(' ')
    }

    return response?.message ?? requestError.message ?? fallback
  }

  function setSession(nextToken, nextUser) {
    token.value = nextToken
    user.value = nextUser

    if (nextToken) {
      localStorage.setItem('auth_token', nextToken)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  function clearSession() {
    token.value = ''
    user.value = null
    localStorage.removeItem('auth_token')
  }

  function setLocalAvatar(url) {
    localAvatar.value = url

    if (url) {
      localStorage.setItem(AVATAR_KEY, url)
    } else {
      localStorage.removeItem(AVATAR_KEY)
    }
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
      if (!session.user) await fetchProfile()
      notice.value = ''
      return true
    } catch (requestError) {
      error.value = getErrorMessage(requestError, 'Login failed.')
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
      if (!session.user) await fetchProfile()
      notice.value = ''
      return true
    } catch (requestError) {
      error.value = getErrorMessage(requestError, 'Registration failed.')
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!token.value) {
      initialized.value = true
      return
    }

    loading.value = true

    try {
      user.value = await getProfile()
    } catch (requestError) {
      error.value = requestError.response?.data?.message ?? ''
      clearSession()
    } finally {
      initialized.value = true
      loading.value = false
    }
  }

  async function saveProfile(payload) {
    loading.value = true
    error.value = ''

    try {
      if (payload.avatarPreview) setLocalAvatar(payload.avatarPreview)

      const updatedUser = await updateProfile(payload)
      user.value = {
        ...user.value,
        ...updatedUser,
        name: updatedUser?.name ?? payload.name ?? user.value?.name,
      }

      return true
    } catch (requestError) {
      if (payload.avatarPreview || payload.name) {
        user.value = {
          ...user.value,
          name: payload.name ?? user.value?.name,
        }
        return true
      }

      error.value = getErrorMessage(requestError, 'Unable to update profile.')
      return false
    } finally {
      loading.value = false
    }
  }

  async function ensureSession() {
    if (!initialized.value) {
      await fetchProfile()
    }

    return isAuthenticated.value
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
    localAvatar,
    loading,
    initialized,
    error,
    notice,
    isAuthenticated,
    customerName,
    initials,
    avatarUrl,
    requireAuth,
    setLocalAvatar,
    login,
    register,
    fetchProfile,
    saveProfile,
    ensureSession,
    logout,
  }
})
