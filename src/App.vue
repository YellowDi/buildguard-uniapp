<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { getStoredSession, resolveHomePath } from '@/shared/auth/session'
import { HAS_WECHAT_APP_ID } from '@/shared/config/env'
import { goToPage } from '@/services/platform/navigation'

onLaunch(() => {
  if (!HAS_WECHAT_APP_ID && import.meta.env.DEV) {
    console.warn('[BuildGuard] WECHAT_APP_ID is missing. Please set it in local .env.')
  }
  const session = getStoredSession()
  if (session) {
    goToPage(resolveHomePath(session.role), true)
  }
})
</script>

<style>
@import './uni.css';
</style>
