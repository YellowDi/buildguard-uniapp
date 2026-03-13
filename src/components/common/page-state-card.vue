<script setup lang="ts">
import AppIcon from '@/components/common/app-icon.vue'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    iconName?: string
    iconColor?: string
    actionText?: string
    actionVariant?: 'primary' | 'secondary'
    surface?: boolean
    iconSurface?: boolean
    spinningIcon?: boolean
    minHeight?: string
  }>(),
  {
    iconColor: '#5c5c5c',
    actionVariant: 'primary',
    surface: false,
    iconSurface: false,
    spinningIcon: false,
    minHeight: '380rpx',
  },
)

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <view
    class="page-state-card"
    :class="{ card: surface, 'page-state-card--surface': surface }"
    :style="{ minHeight }"
  >
    <view
      v-if="iconName"
      class="page-state-card__icon-wrap"
      :class="{ 'page-state-card__icon-wrap--surface': iconSurface }"
    >
      <AppIcon
        :name="iconName"
        class="page-state-card__icon"
        :class="{ spinner: spinningIcon }"
        :color="iconColor"
      />
    </view>
    <text v-if="title" class="page-state-card__title">{{ title }}</text>
    <text v-if="description" class="page-state-card__description">{{ description }}</text>
    <slot />
    <view
      v-if="actionText"
      class="btn page-state-card__action"
      :class="actionVariant === 'secondary' ? 'btn-secondary' : 'btn-primary'"
      @tap="emit('action')"
    >
      {{ actionText }}
    </view>
  </view>
</template>

<style scoped>
.page-state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  text-align: center;
}

.page-state-card--surface {
  padding: 24rpx;
  margin-top: 16rpx;
}

.page-state-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-state-card__icon-wrap--surface {
  width: 112rpx;
  height: 112rpx;
  border-radius: 32rpx;
  background: var(--bg-softer);
}

.page-state-card__icon {
  font-size: 56rpx;
  color: var(--text-quaternary);
}

.page-state-card__title {
  display: block;
  margin-top: 16rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.page-state-card__description {
  display: block;
  max-width: 480rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: var(--text-secondary);
}

.page-state-card__action {
  width: 180rpx;
  margin-top: 8rpx;
}
</style>
