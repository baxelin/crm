const BASE_URL = '/api'

async function errorMessage(response) {
  const fallback = `Erro ${response.status}`
  try {
    const data = await response.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const isJson = body !== undefined && !(body instanceof FormData)
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: isJson ? { 'Content-Type': 'application/json' } : undefined,
    body: isJson ? JSON.stringify(body) : body,
  })

  if (!response.ok) throw new Error(await errorMessage(response))
  return response.status === 204 ? null : response.json()
}

export const http = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
