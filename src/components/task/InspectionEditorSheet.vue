<script setup lang="ts">
import { ref, watch } from 'vue'
import AppIcon from '@/components/common/app-icon.vue'
import BaseSheet from '@/components/common/BaseSheet.vue'
import type { CheckItem, CheckItemStatus } from '@/shared/types/task'
import { chooseImages } from '@/services/platform/media'
import { useTheme } from '@/services/platform/theme'

const props = defineProps<{
  visible: boolean
  item: CheckItem | null
}>()

const emit = defineEmits<{
  (
    e: 'save',
    payload: { status: CheckItemStatus; photos: string[]; description: string; impact: string }
  ): void
  (e: 'close'): void
}>()

const selectedStatus = ref<CheckItemStatus>('unchecked')
const photos = ref<string[]>([])
const description = ref('')
const impact = ref('')
const { isDark } = useTheme()

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    selectedStatus.value = props.item?.status ?? 'unchecked'
    photos.value = props.item?.photos ? [...props.item.photos] : []
    description.value = props.item?.description ?? ''
    impact.value = props.item?.impact ?? ''
  },
  { immediate: true },
)

async function onChooseImages() {
  const selected = await chooseImages(9 - photos.value.length)
  photos.value = [...photos.value, ...selected]
}

function removePhoto(index: number) {
  photos.value.splice(index, 1)
}

function submit() {
  emit('save', {
    status: selectedStatus.value,
    photos: [...photos.value],
    description: description.value.trim(),
    impact: impact.value.trim(),
  })
}
</script>

<template>
  <BaseSheet
    :visible="visible"
    :title="item?.name || '巡检项'"
    :show-header-divider="false"
    @close="emit('close')"
  >
    <scroll-view scroll-y class="sheet-scroll">
      <view class="field-group">
        <text class="field-label">情况状态</text>
        <view class="status-grid">
          <view
            class="status-card"
            :class="{ active: selectedStatus === 'normal', normal: selectedStatus === 'normal' }"
            @tap="selectedStatus = 'normal'"
          >
            <AppIcon name="ri-checkbox-circle-fill" class="status-icon" :color="selectedStatus === 'normal' ? '#1fc16b' : (isDark ? '#a3a3a3' : '#5c5c5c')" />
            <text class="status-text">一切正常</text>
          </view>
          <view
            class="status-card"
            :class="{ active: selectedStatus === 'focus', focus: selectedStatus === 'focus' }"
            @tap="selectedStatus = 'focus'"
          >
            <AppIcon name="ri-alert-line" class="status-icon" :color="selectedStatus === 'focus' ? '#fa7319' : (isDark ? '#a3a3a3' : '#5c5c5c')" />
            <text class="status-text">需重点关注</text>
          </view>
          <view
            class="status-card"
            :class="{ active: selectedStatus === 'risk', risk: selectedStatus === 'risk' }"
            @tap="selectedStatus = 'risk'"
          >
            <AppIcon name="ri-error-warning-fill" class="status-icon" :color="selectedStatus === 'risk' ? '#e5484d' : (isDark ? '#a3a3a3' : '#5c5c5c')" />
            <text class="status-text">存在风险</text>
          </view>
        </view>
      </view>

      <view class="field-group">
        <text class="field-label">现场照片</text>
        <view class="photo-grid">
          <view v-for="(photo, index) in photos" :key="`${photo}-${index}`" class="photo-card">
            <image class="photo-img" :src="photo" mode="aspectFill" />
            <view class="remove-dot" @tap="removePhoto(index)">
              <AppIcon name="ri-close-line" color="#ffffff" />
            </view>
          </view>
          <view class="photo-upload" @tap="onChooseImages">
            <AppIcon name="ri-camera-line" class="photo-icon" :color="isDark ? '#a3a3a3' : '#a3a3a3'" />
            <text class="photo-text">上传照片</text>
          </view>
        </view>
      </view>

      <view class="field-group">
        <text class="field-label">问题描述</text>
        <textarea
          v-model="description"
          class="text-area"
          placeholder="请描述发现的问题…"
          maxlength="400"
        />
      </view>

      <view class="field-group">
        <text class="field-label">影响评估</text>
        <textarea
          v-model="impact"
          class="text-area"
          placeholder="请评估该问题的影响…"
          maxlength="400"
        />
      </view>
    </scroll-view>

    <view class="sheet-footer">
      <view class="btn btn-primary sheet-submit-btn" @tap="submit">提交结果</view>
    </view>
  </BaseSheet>
</template>

<style scoped>
.sheet-scroll {
  max-height: 60vh;
  padding: 0 32rpx 24rpx;
  box-sizing: border-box;
}

.field-group {
  margin-bottom: 28rpx;
}

.field-label {
  display: block;
  margin-bottom: 16rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: var(--text-primary);
}

.status-grid {
  display: flex;
  gap: 16rpx;
}

.status-card {
  flex: 1;
  height: 80rpx;
  border-radius: 16rpx;
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: var(--bg-card);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
}

.status-icon {
  width: 36rpx;
  height: 36rpx;
  flex: none;
}

.status-text {
  font-size: 26rpx;
  line-height: 40rpx;
  font-weight: 500;
  color: var(--text-secondary);
}

.status-card.active.normal {
  border-color: var(--status-success);
  background: var(--status-success-soft);
}

.status-card.active.focus {
  border-color: var(--status-warning);
  background: var(--status-warning-soft);
}

.status-card.active.risk {
  border-color: var(--status-danger);
  background: var(--status-danger-soft);
}

.status-card.active.normal .status-text {
  color: var(--status-success);
}

.status-card.active.focus .status-text {
  color: var(--status-warning);
}

.status-card.active.risk .status-text {
  color: var(--status-danger);
}

.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.photo-card,
.photo-upload {
  width: 152rpx;
  height: 152rpx;
  border-radius: 16rpx;
  overflow: hidden;
  position: relative;
}

.photo-card {
  background: var(--bg-softer);
}

.photo-img {
  width: 100%;
  height: 100%;
}

.remove-dot {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 999rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-upload {
  border: 1px dashed var(--border-strong);
  background: var(--bg-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
}

.photo-icon {
  font-size: 40rpx;
}

.photo-text {
  font-size: 22rpx;
  color: var(--text-quaternary);
}

.text-area {
  width: 100%;
  min-height: 176rpx;
  border-radius: 16rpx;
  background: var(--bg-softer);
  padding: 24rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  line-height: 40rpx;
  color: var(--text-primary);
}

.sheet-footer {
  padding: 24rpx 32rpx calc(env(safe-area-inset-bottom) + 12px);
  border-top: 1px solid var(--border-subtle);
  box-sizing: border-box;
}

.sheet-submit-btn {
  height: 80rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  line-height: 40rpx;
}
</style>
