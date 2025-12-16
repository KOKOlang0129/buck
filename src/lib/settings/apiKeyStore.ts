const STORAGE_KEY = 'secure_api_key_v1'

const isBrowser = typeof window !== 'undefined'

export const saveApiKey = (key: string) => {
  if (!isBrowser) return
  const payload = {
    v: 1,
    data: btoa(key)
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export const loadApiKey = (): string | null => {
  if (!isBrowser) return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const payload = JSON.parse(raw)
    return payload?.data ? atob(payload.data) : null
  } catch {
    return null
  }
}

export const clearApiKey = () => {
  if (!isBrowser) return
  sessionStorage.removeItem(STORAGE_KEY)
}

