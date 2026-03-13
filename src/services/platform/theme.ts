import { computed, ref } from 'vue'
import { getStorageString, setStorageString } from './storage'

const STORAGE_KEY = 'buildguard-theme'
const theme = ref(getStorageString(STORAGE_KEY) === 'dark' ? 'dark' : 'light')

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    setStorageString(STORAGE_KEY, theme.value)
  }

  return {
    theme,
    isDark,
    toggleTheme,
  }
}
