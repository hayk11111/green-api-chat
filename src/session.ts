import type { Credentials } from './api'

const STORAGE_KEY = 'green-api-credentials'

export const DEFAULT_API_URL = 'https://api.green-api.com'

export function loadCredentials(): Credentials | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<Credentials>
    if (!parsed.apiUrl || !parsed.idInstance || !parsed.apiTokenInstance) return null
    return parsed as Credentials
  } catch {
    return null
  }
}

export function saveCredentials(credentials: Credentials) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
}

export function clearCredentials() {
  sessionStorage.removeItem(STORAGE_KEY)
}
