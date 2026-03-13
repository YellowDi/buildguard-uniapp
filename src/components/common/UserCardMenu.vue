<script setup lang="ts">
import { getCurrentInstance, nextTick, ref, watch } from 'vue'
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
const instance = getCurrentInstance()
const open = ref(false)
const fusionHeight = ref(0)

function updateFusionHeight() {
  nextTick(() => {
    if (!instance?.proxy) return
    const query = uni.createSelectorQuery().in(instance.proxy)
    query.select('.menu-trigger').boundingClientRect()
    query.select('.menu-panel').boundingClientRect()
    query.exec((result) => {
      const triggerRect = result?.[0]
      const panelRect = result?.[1]
      if (!triggerRect || !panelRect) return
      fusionHeight.value = Math.ceil((triggerRect.height || 0) + (panelRect.height || 0))
    })
  })
}

watch(open, (value) => {
  if (!value) return
  updateFusionHeight()
})
</script>

<template>
  <view class="menu-root">
    <view v-if="open" class="menu-mask" @tap="open = false" />
    <view
      v-if="open"
      class="menu-fusion-bg"
      :style="fusionHeight ? { height: `${fusionHeight}px` } : undefined"
    />

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
  z-index: 20;
  width: fit-content;
}

.menu-mask {
  position: fixed;
  inset: 0;
  z-index: 10;
  background: transparent;
}

.menu-fusion-bg {
  position: absolute;
  top: 0;
  left: -12rpx;
  right: -12rpx;
  z-index: 15;
  border-radius: 20rpx;
  background: var(--bg-card);
  box-shadow:
    0 0 0 1px rgba(23, 23, 23, 0.08),
    0 8px 24px rgba(23, 23, 23, 0.08),
    0 1px 2px rgba(23, 23, 23, 0.04);
}

.theme-dark .menu-fusion-bg,
:deep(.theme-dark) .menu-fusion-bg {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 10px 26px rgba(0, 0, 0, 0.24),
    0 2px 4px rgba(0, 0, 0, 0.18);
}

.menu-block {
  position: relative;
  z-index: 20;
  min-width: 236rpx;
  border-radius: 20rpx;
}

.menu-trigger {
  padding: 14rpx 16rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: transparent;
  transition: background-color 0.18s ease;
}

.expanded .menu-trigger {
  border-radius: 20rpx 20rpx 0 0;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 14rpx;
  background: #c4c4c4;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.9);
}

.avatar-fallback {
  background: #c4c4c4;
}

.trigger-copy {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.trigger-name {
  font-size: 26rpx;
  line-height: 34rpx;
  font-weight: 500;
  color: var(--text-primary);
}

.trigger-count {
  font-size: 22rpx;
  line-height: 28rpx;
  color: var(--text-secondary);
}

.trigger-arrow {
  width: 28rpx;
  height: 28rpx;
  transition: transform 0.25s ease;
}

.rotated {
  transform: rotate(180deg);
}

.menu-panel {
  position: absolute;
  top: calc(100% - 2rpx);
  left: -12rpx;
  right: -12rpx;
  z-index: 25;
  overflow: hidden;
  border-radius: 0 0 18rpx 18rpx;
  background: transparent;
}

.menu-item {
  height: 80rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 24rpx;
  color: var(--text-primary);
  background: transparent;
}

.menu-item + .menu-item {
  border-top: 1px solid var(--border-subtle);
}
</style>
