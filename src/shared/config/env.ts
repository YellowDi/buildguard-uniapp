const processEnv =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env || {}
const fromProcessEnv = processEnv.WECHAT_APP_ID

export const WECHAT_APP_ID = fromProcessEnv || import.meta.env.VITE_WECHAT_APP_ID || ''

export const HAS_WECHAT_APP_ID = WECHAT_APP_ID.length > 0
