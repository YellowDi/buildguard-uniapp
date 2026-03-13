const FALLBACK_SAFE_TOP = 'calc(var(--status-bar-height, 0px) + 12px)'
const FALLBACK_STATUS_BAR = 'var(--status-bar-height, 0px)'
const FALLBACK_NAV_BAR_HEIGHT = '44px'
const FALLBACK_NAV_BAR_ROW_HEIGHT = '44px'
const FALLBACK_MENU_BUTTON_WIDTH = '96px'
const FALLBACK_MENU_BUTTON_HEIGHT = '32px'
const FALLBACK_MENU_BUTTON_TOP = '6px'
const FALLBACK_HORIZONTAL_GAP = '12px'
const FALLBACK_VERTICAL_GAP = '6px'

let cachedSafeTopOffset: string | null = null
let cachedStatusBarHeight: string | null = null
let cachedNavBarHeight: string | null = null
let cachedNavBarRowHeight: string | null = null
let cachedMenuButtonWidth: string | null = null
let cachedMenuButtonHeight: string | null = null
let cachedMenuButtonTop: string | null = null
let cachedHorizontalGap: string | null = null
let cachedVerticalGap: string | null = null

function resolveSafeTopOffset() {
  if (cachedSafeTopOffset) return cachedSafeTopOffset

  try {
    const systemInfo = uni.getSystemInfoSync()
    const statusBarHeight = Number(systemInfo.statusBarHeight || 0)
    const windowWidth = Number(systemInfo.windowWidth || 0)
    let topOffset = statusBarHeight + 12

    // #ifdef MP-WEIXIN
    const weixinApi = globalThis as typeof globalThis & {
      wx?: {
        getMenuButtonBoundingClientRect?: () => {
          top: number
          bottom: number
          height: number
          right: number
          width: number
        }
      }
    }
    const menuButtonRect = weixinApi.wx?.getMenuButtonBoundingClientRect?.()
    if (menuButtonRect?.bottom) {
      const verticalGap = statusBarHeight > 0 ? Math.max(menuButtonRect.top - statusBarHeight, 0) : 6
      const horizontalGap = windowWidth > 0 ? Math.max(windowWidth - menuButtonRect.right, 12) : 12
      topOffset = Math.ceil(menuButtonRect.bottom + verticalGap + 8)
      cachedStatusBarHeight = `${statusBarHeight}px`
      const navTotalHeight = Math.ceil(statusBarHeight + menuButtonRect.height + verticalGap * 2)
      cachedNavBarHeight = `${navTotalHeight}px`
      cachedNavBarRowHeight = `${Math.ceil(menuButtonRect.height)}px`
      cachedMenuButtonWidth = `${Math.ceil(menuButtonRect.width)}px`
      cachedMenuButtonHeight = `${Math.ceil(menuButtonRect.height)}px`
      cachedMenuButtonTop = `${Math.ceil(menuButtonRect.top)}px`
      cachedHorizontalGap = `${Math.ceil(horizontalGap)}px`
      cachedVerticalGap = `${Math.ceil(verticalGap)}px`
    } else if (statusBarHeight > 0) {
      topOffset = statusBarHeight + 44 + 12
      cachedStatusBarHeight = `${statusBarHeight}px`
      cachedNavBarHeight = `${statusBarHeight + 44}px`
      cachedNavBarRowHeight = '44px'
      cachedMenuButtonTop = `${statusBarHeight + 6}px`
      cachedVerticalGap = FALLBACK_VERTICAL_GAP
    }
    // #endif

    if (!cachedStatusBarHeight) {
      cachedStatusBarHeight = `${statusBarHeight}px`
    }
    if (!cachedNavBarHeight) {
      cachedNavBarHeight = `${statusBarHeight + 44}px`
    }
    if (!cachedNavBarRowHeight) {
      cachedNavBarRowHeight = FALLBACK_NAV_BAR_ROW_HEIGHT
    }
    if (!cachedMenuButtonWidth) {
      cachedMenuButtonWidth = FALLBACK_MENU_BUTTON_WIDTH
    }
    if (!cachedMenuButtonHeight) {
      cachedMenuButtonHeight = FALLBACK_MENU_BUTTON_HEIGHT
    }
    if (!cachedMenuButtonTop) {
      cachedMenuButtonTop = FALLBACK_MENU_BUTTON_TOP
    }
    if (!cachedHorizontalGap) {
      cachedHorizontalGap = FALLBACK_HORIZONTAL_GAP
    }
    if (!cachedVerticalGap) {
      cachedVerticalGap = FALLBACK_VERTICAL_GAP
    }

    cachedSafeTopOffset = `${Math.max(topOffset, 12)}px`
    return cachedSafeTopOffset
  } catch {
    return FALLBACK_SAFE_TOP
  }
}

export function useTopSafeAreaVars() {
  const safeTopOffset = resolveSafeTopOffset()
  return {
    '--safe-top-offset': safeTopOffset,
    '--status-bar-safe-top': cachedStatusBarHeight || FALLBACK_STATUS_BAR,
    '--page-nav-height': cachedNavBarHeight || FALLBACK_NAV_BAR_HEIGHT,
    '--page-nav-row-height': cachedNavBarRowHeight || FALLBACK_NAV_BAR_ROW_HEIGHT,
    '--page-nav-content-height': cachedMenuButtonHeight || FALLBACK_MENU_BUTTON_HEIGHT,
    '--page-nav-row-offset': cachedMenuButtonTop || FALLBACK_MENU_BUTTON_TOP,
    '--page-nav-side-width': cachedMenuButtonWidth || FALLBACK_MENU_BUTTON_WIDTH,
    '--page-nav-horizontal-padding': cachedHorizontalGap || FALLBACK_HORIZONTAL_GAP,
    '--page-nav-vertical-gap': cachedVerticalGap || FALLBACK_VERTICAL_GAP,
  }
}

export function usePageNavVars() {
  resolveSafeTopOffset()
  return {
    '--status-bar-safe-top': cachedStatusBarHeight || FALLBACK_STATUS_BAR,
    '--page-nav-height': cachedNavBarHeight || FALLBACK_NAV_BAR_HEIGHT,
    '--page-nav-row-height': cachedNavBarRowHeight || FALLBACK_NAV_BAR_ROW_HEIGHT,
    '--page-nav-content-height': cachedMenuButtonHeight || FALLBACK_MENU_BUTTON_HEIGHT,
    '--page-nav-row-offset': cachedMenuButtonTop || FALLBACK_MENU_BUTTON_TOP,
    '--page-nav-side-width': cachedMenuButtonWidth || FALLBACK_MENU_BUTTON_WIDTH,
    '--page-nav-horizontal-padding': cachedHorizontalGap || FALLBACK_HORIZONTAL_GAP,
    '--page-nav-vertical-gap': cachedVerticalGap || FALLBACK_VERTICAL_GAP,
  }
}
