<script setup lang="ts">
import BaseSheet from '@/components/common/BaseSheet.vue'
import MediaGridField from '@/components/common/media-grid-field.vue'
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
    <scroll-view scroll-y class="sheet-scroll maintenance-result__scroll">
      <MediaGridField
        label="维修前记录"
        :items="beforeMedia"
        :can-upload="false"
        :can-remove="false"
        previewable
        @preview="previewImages(beforeMedia, $event)"
      />

      <MediaGridField
        label="维修后记录"
        :items="afterMedia"
        :can-upload="false"
        :can-remove="false"
        previewable
        @preview="previewImages(afterMedia, $event)"
      />

      <view class="form-field">
        <text class="form-field__label">维修文字说明</text>
        <view class="text-card">
          <text class="text-card__content">{{ executionNote || '暂无说明' }}</text>
        </view>
      </view>

      <view v-if="completionSummary" class="form-field">
        <text class="form-field__label">维修结论</text>
        <view class="text-card">
          <text class="text-card__content">{{ completionSummary }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="sheet-footer">
      <view v-if="confirmable" class="btn btn-primary" @tap="emit('confirm')">确认生成维修报告</view>
      <view v-else class="btn btn-secondary" @tap="emit('close')">关闭</view>
    </view>
  </BaseSheet>
</template>

<style scoped>
.maintenance-result__scroll {
  max-height: 62vh;
}
</style>
