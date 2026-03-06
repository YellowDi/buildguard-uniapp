import { ref, watch } from 'vue'

const STORAGE_KEY = 'buildguard-theme'

function getStored(): boolean {
  if (typeof document === 'undefined') return false
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === 'dark') return true
  if (v === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(isDark: boolean) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (isDark) html.classList.add('dark')
  else html.classList.remove('dark')
  localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
}

const isDark = ref(getStored())

export function useDarkMode() {
  watch(
    isDark,
    (v) => apply(v),
    { immediate: true }
  )

  function toggle() {
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
}
