import http from './http'

function unwrapUser(payload) {
  const user = payload?.data?.user ?? payload?.user
  if (user) return user

  const data = payload?.data
  if (data?.email || data?.name) return data
  if (payload?.email || payload?.name) return payload

  return null
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

export async function updateProfile(payload) {
  const hasImage = payload.avatar instanceof File
  const body = hasImage ? new FormData() : {}

  if (hasImage) {
    body.append('_method', 'PATCH')
    body.append('avatar', payload.avatar)
    body.append('name', payload.name)
  } else {
    body.name = payload.name
    body.avatar_url = payload.avatar_url
  }

  const { data } = hasImage
    ? await http.post('/profile', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    : await http.patch('/profile', body)

  return unwrapUser(data)
}

export async function logoutCustomer() {
  const { data } = await http.post('/logout')
  return data
}
