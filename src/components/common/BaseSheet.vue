<script setup lang="ts">
import AppIcon from '@/components/common/app-icon.vue'
import { useTheme } from '@/services/platform/theme'

defineProps<{
  visible: boolean
  title?: string
  subtitle?: string
  maxHeight?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { isDark } = useTheme()
</script>

<template>
  <view v-if="visible" class="sheet-wrap">
    <view class="overlay" @tap="emit('close')" />
    <view class="sheet-panel" :style="{ maxHeight: maxHeight || '88vh' }">
      <view class="sheet-handle" />
      <view class="sheet-header">
        <view class="sheet-header-copy">
          <text v-if="title" class="sheet-title">{{ title }}</text>
          <text v-if="subtitle" class="sheet-subtitle">{{ subtitle }}</text>
        </view>
        <view class="icon-btn" @tap="emit('close')">
          <AppIcon name="ri-close-line" :color="isDark ? '#a3a3a3' : '#5c5c5c'" />
        </view>
      </view>
      <slot />
    </view>
  </view>
</template>

<style scoped>
.sheet-header {
  padding: 0 32rpx 24rpx;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 24rpx;
}

.sheet-header-copy {
  flex: 1;
  min-width: 0;
}

.sheet-title {
  display: block;
  font-size: 32rpx;
  line-height: 44rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.sheet-subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: var(--text-secondary);
}
</style>
