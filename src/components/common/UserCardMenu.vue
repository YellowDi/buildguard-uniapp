<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/common/app-icon.vue'
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
    <view v-if="open" class="menu-mask" @tap="open = false" />

    <view class="menu-block" :class="{ expanded: open }">
      <view class="menu-trigger" @tap="open = !open">
        <image v-if="avatarUrl" class="avatar" :src="avatarUrl" mode="aspectFill" />
        <view v-else class="avatar avatar-fallback" />
        <view class="trigger-copy">
          <text class="trigger-name">{{ name }}</text>
          <text class="trigger-count">已完成 {{ completedCount }} 任务</text>
        </view>
        <AppIcon
          name="ri-arrow-down-s-line"
          class="trigger-arrow"
          :class="{ rotated: open }"
          :color="isDark ? '#a3a3a3' : '#5c5c5c'"
        />
      </view>

      <view v-if="open" class="menu-panel">
        <view class="menu-item" @tap="toggleTheme(); open = false">
          <AppIcon :name="isDark ? 'ri-sun-line' : 'ri-moon-line'" :color="isDark ? '#a3a3a3' : '#5c5c5c'" />
          <text>{{ isDark ? '关闭暗色模式' : '暗色模式' }}</text>
        </view>
        <view class="menu-item" @tap="emit('switchIdentity'); open = false">
          <AppIcon name="ri-user-shared-line" :color="isDark ? '#a3a3a3' : '#5c5c5c'" />
          <text>切换身份（临时）</text>
        </view>
        <view class="menu-item" @tap="emit('logout'); open = false">
          <AppIcon name="ri-logout-box-r-line" :color="isDark ? '#a3a3a3' : '#5c5c5c'" />
          <text>退出登录</text>
        </view>
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
  position: fixed;
  inset: 0;
  z-index: 30;
  background: transparent;
}

.menu-block {
  position: relative;
  z-index: 40;
  min-width: 244rpx;
}

.menu-block.expanded {
  border-radius: 20rpx 20rpx 18rpx 18rpx;
  background: var(--bg-card);
  box-shadow: var(--card-shadow);
}

.menu-trigger {
  padding: 12rpx 16rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
  background: transparent;
}

.expanded .menu-trigger {
  border-radius: 20rpx 20rpx 0 0;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  background: #c4c4c4;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.9);
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
  line-height: 34rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.trigger-count {
  font-size: 22rpx;
  line-height: 30rpx;
  color: var(--text-secondary);
}

.trigger-arrow {
  font-size: 32rpx;
  transition: transform 0.25s ease;
}

.rotated {
  transform: rotate(180deg);
}

.menu-panel {
  position: absolute;
  top: calc(100% - 2rpx);
  left: 0;
  right: 0;
  overflow: hidden;
  border-radius: 0 0 18rpx 18rpx;
  background: var(--bg-card);
  z-index: 40;
}

.menu-item {
  height: 84rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
  color: var(--text-primary);
}

.menu-item + .menu-item {
  border-top: 1px solid var(--border-subtle);
}
</style>
