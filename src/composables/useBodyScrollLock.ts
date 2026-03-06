import { onBeforeUnmount, ref } from 'vue'

let lockCount = 0
let savedScrollY = 0

function applyLock() {
  savedScrollY = window.scrollY
  document.documentElement.style.overflow = 'hidden'
  document.documentElement.style.touchAction = 'none'
  document.body.style.overflow = 'hidden'
  document.body.style.touchAction = 'none'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${savedScrollY}px`
  document.body.style.left = '0'
  document.body.style.right = '0'
  document.body.style.width = '100%'
}

function releaseLock() {
  document.documentElement.style.overflow = ''
  document.documentElement.style.touchAction = ''
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  window.scrollTo(0, savedScrollY)
}

export function useBodyScrollLock() {
  const isLocked = ref(false)

  function lock() {
    if (isLocked.value) return
    if (lockCount === 0) applyLock()
    lockCount += 1
    isLocked.value = true
  }

  function unlock() {
    if (!isLocked.value) return
    lockCount = Math.max(0, lockCount - 1)
    isLocked.value = false
    if (lockCount === 0) releaseLock()
  }

  onBeforeUnmount(() => {
    unlock()
  })

  return { lock, unlock, isLocked }
}
