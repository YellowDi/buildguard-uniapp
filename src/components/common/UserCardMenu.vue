<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/services/platform/theme'

defineProps<{
  name: string
  avatarUrl?: string
  completedCount: number
}>()

const emit = defineEmits<{
  (e: 'logout'): void
  (e: 'switchIdentity'): void
}>()

const { isDark, toggleTheme } = useTheme()
const open = ref(false)
</script>

<template>
  <view class="menu-root">
    <view v-if="open" class="overlay menu-mask" @tap="open = false" />
    <view class="menu-trigger" @tap="open = !open">
      <image v-if="avatarUrl" class="avatar" :src="avatarUrl" mode="aspectFill" />
      <view v-else class="avatar avatar-fallback" />
      <view class="trigger-copy">
        <text class="trigger-name">{{ name }}</text>
        <text class="trigger-count">已完成 {{ completedCount }} 任务</text>
      </view>
      <text class="app-icon ri-arrow-down-s-line trigger-arrow" :class="{ rotated: open }" />
    </view>

    <view v-if="open" class="menu-panel card">
      <view class="menu-item" @tap="toggleTheme(); open = false">
        <text class="app-icon" :class="isDark ? 'ri-sun-line' : 'ri-moon-line'" />
        <text>{{ isDark ? '关闭暗色模式' : '暗色模式' }}</text>
      </view>
      <view class="menu-item" @tap="emit('switchIdentity'); open = false">
        <text class="app-icon ri-user-shared-line" />
        <text>切换身份</text>
      </view>
      <view class="menu-item" @tap="emit('logout'); open = false">
        <text class="app-icon ri-logout-box-r-line" />
        <text>退出登录</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.menu-root {
  position: relative;
  z-index: 40;
}

.menu-mask {
  z-index: 30;
}

.menu-trigger {
  position: relative;
  z-index: 40;
  padding: 10rpx 16rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  background: #c4c4c4;
}

.avatar-fallback {
  background: #c4c4c4;
}

.trigger-copy {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.trigger-name {
  font-size: 26rpx;
  line-height: 36rpx;
  font-weight: 600;
}

.trigger-count {
  font-size: 22rpx;
  line-height: 32rpx;
  color: #5c5c5c;
}

.trigger-arrow {
  font-size: 32rpx;
  color: #5c5c5c;
  transition: transform 0.2s ease;
}

.rotated {
  transform: rotate(180deg);
}

.menu-panel {
  position: absolute;
  top: calc(100% + 12rpx);
  right: 0;
  min-width: 260rpx;
  padding: 12rpx 0;
  z-index: 40;
}

.menu-item {
  height: 76rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
}
</style>
