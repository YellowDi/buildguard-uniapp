<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseSheet from '@/components/common/BaseSheet.vue'
import type { CheckItem, CheckItemStatus } from '@/shared/types/task'
import { chooseImages } from '@/services/platform/media'

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
    subtitle="填写现场状态、照片和说明"
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
            <text>一切正常</text>
          </view>
          <view
            class="status-card"
            :class="{ active: selectedStatus === 'focus', focus: selectedStatus === 'focus' }"
            @tap="selectedStatus = 'focus'"
          >
            <text>需重点关注</text>
          </view>
          <view
            class="status-card"
            :class="{ active: selectedStatus === 'risk', risk: selectedStatus === 'risk' }"
            @tap="selectedStatus = 'risk'"
          >
            <text>存在风险</text>
          </view>
        </view>
      </view>

      <view class="field-group">
        <text class="field-label">现场照片</text>
        <view class="photo-grid">
          <view v-for="(photo, index) in photos" :key="`${photo}-${index}`" class="photo-card">
            <image class="photo-img" :src="photo" mode="aspectFill" />
            <view class="remove-dot" @tap="removePhoto(index)">
              <text class="app-icon ri-close-line" />
            </view>
          </view>
          <view class="photo-upload" @tap="onChooseImages">
            <text class="app-icon ri-camera-line photo-icon" />
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

    <view class="sheet-footer safe-bottom">
      <view class="btn btn-primary" @tap="submit">提交结果</view>
    </view>
  </BaseSheet>
</template>

<style scoped>
.sheet-scroll {
  max-height: 60vh;
  padding: 0 32rpx 24rpx;
}

.field-group {
  margin-bottom: 28rpx;
}

.field-label {
  display: block;
  margin-bottom: 16rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: #5c5c5c;
}

.status-grid {
  display: flex;
  gap: 16rpx;
}

.status-card {
  flex: 1;
  min-height: 84rpx;
  border-radius: 20rpx;
  border: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #5c5c5c;
}

.status-card.active.normal {
  border-color: #1fc16b;
  background: #f0fdf4;
  color: #1fc16b;
}

.status-card.active.focus {
  border-color: #fa7319;
  background: #fff7ed;
  color: #fa7319;
}

.status-card.active.risk {
  border-color: #e5484d;
  background: #fef2f2;
  color: #e5484d;
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
  border-radius: 20rpx;
  overflow: hidden;
  position: relative;
}

.photo-card {
  background: #f5f5f5;
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
  border: 1px dashed #d4d4d4;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
}

.photo-icon {
  font-size: 40rpx;
  color: #a3a3a3;
}

.photo-text {
  font-size: 22rpx;
  color: #a3a3a3;
}

.text-area {
  width: 100%;
  min-height: 176rpx;
  border-radius: 20rpx;
  background: #fafafa;
  padding: 24rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  line-height: 40rpx;
}

.sheet-footer {
  padding: 24rpx 32rpx 0;
  border-top: 1px solid #f0f0f0;
}
</style>
