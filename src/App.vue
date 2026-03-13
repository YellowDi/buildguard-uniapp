<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { getStoredSession, resolveHomePath } from '@/shared/auth/session'
import { goToPage } from '@/services/platform/navigation'

onLaunch(() => {
  const session = getStoredSession()
  if (session) {
    goToPage(resolveHomePath(session.role), true)
  }
})
</script>

<style>
@import './uni.css';
</style>
