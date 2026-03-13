<script setup lang="ts">
import BaseSheet from '@/components/common/BaseSheet.vue'
import { previewImages } from '@/services/platform/media'

const props = defineProps<{
  visible: boolean
  beforeMedia: string[]
  afterMedia: string[]
  executionNote: string
  completionSummary?: string
  confirmable?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <BaseSheet
    :visible="visible"
    title="维修报告"
    subtitle="核对维修前后记录和处理说明"
    max-height="90vh"
    @close="emit('close')"
  >
    <scroll-view scroll-y class="report-scroll">
      <view class="block">
        <text class="label">维修前记录</text>
        <view class="thumb-row">
          <image
            v-for="photo in beforeMedia"
            :key="photo"
            class="thumb"
            :src="photo"
            mode="aspectFill"
            @tap="previewImages(beforeMedia, photo)"
          />
        </view>
      </view>

      <view class="block">
        <text class="label">维修后记录</text>
        <view class="thumb-row">
          <image
            v-for="photo in afterMedia"
            :key="photo"
            class="thumb"
            :src="photo"
            mode="aspectFill"
            @tap="previewImages(afterMedia, photo)"
          />
        </view>
      </view>

      <view class="block">
        <text class="label">维修文字说明</text>
        <view class="copy-card">
          <text class="copy">{{ executionNote || '暂无说明' }}</text>
        </view>
      </view>

      <view v-if="completionSummary" class="block">
        <text class="label">维修结论</text>
        <view class="copy-card">
          <text class="copy">{{ completionSummary }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="sheet-footer safe-bottom">
      <view v-if="confirmable" class="btn btn-primary" @tap="emit('confirm')">确认生成维修报告</view>
      <view v-else class="btn btn-secondary" @tap="emit('close')">关闭</view>
    </view>
  </BaseSheet>
</template>

<style scoped>
.report-scroll {
  max-height: 62vh;
  padding: 0 32rpx 24rpx;
}

.block + .block {
  margin-top: 28rpx;
}

.label {
  display: block;
  margin-bottom: 14rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: var(--text-primary);
}

.copy-card {
  padding: 24rpx;
  border-radius: 20rpx;
  background: var(--bg-softer);
}

.copy {
  display: block;
  font-size: 28rpx;
  line-height: 40rpx;
  color: var(--text-secondary);
}

.thumb-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.thumb {
  width: 176rpx;
  height: 176rpx;
  border-radius: 20rpx;
  background: var(--bg-softer);
}

.sheet-footer {
  padding: 24rpx 32rpx 0;
  border-top: 1px solid var(--border-subtle);
}
</style>
