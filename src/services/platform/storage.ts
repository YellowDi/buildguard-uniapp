export function getStorageString(key: string): string | null {
  const value = uni.getStorageSync(key)
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized ? normalized : null
}

export function setStorageString(key: string, value: string) {
  uni.setStorageSync(key, value)
}

export function removeStorage(key: string) {
  uni.removeStorageSync(key)
}

