import http from './http'

function unwrapUser(payload) {
  return payload?.data?.user ?? payload?.user ?? payload?.data ?? null
}

function unwrapToken(payload) {
  return payload?.data?.token ?? payload?.data?.access_token ?? payload?.token ?? payload?.access_token ?? ''
}

export async function loginCustomer(credentials) {
  const { data } = await http.post('/login', credentials)

  return {
    token: unwrapToken(data),
    user: unwrapUser(data),
  }
}

export async function registerCustomer(payload) {
  const { data } = await http.post('/register', payload)

  return {
    token: unwrapToken(data),
    user: unwrapUser(data),
  }
}

export async function getProfile() {
  const { data } = await http.get('/profile')
  return unwrapUser(data)
}

export async function logoutCustomer() {
  const { data } = await http.post('/logout')
  return data
}
