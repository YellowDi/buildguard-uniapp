<script setup lang="ts">
import AppIcon from '@/components/common/app-icon.vue'

withDefaults(
  defineProps<{
    label: string
    items: string[]
    size?: 'compact' | 'regular'
    uploadText?: string
    uploadIcon?: string
    uploadLinkText?: string
    canUpload?: boolean
    canRemove?: boolean
    previewable?: boolean
  }>(),
  {
    size: 'regular',
    uploadText: '上传',
    uploadIcon: 'ri-camera-line',
    uploadLinkText: '上传',
    canUpload: true,
    canRemove: true,
    previewable: false,
  },
)

const emit = defineEmits<{
  (e: 'upload'): void
  (e: 'remove', index: number): void
  (e: 'preview', item: string): void
}>()

function onPreview(item: string) {
  emit('preview', item)
}
</script>

<template>
  <view class="form-field">
    <view v-if="canUpload" class="form-field__head">
      <text class="form-field__label">{{ label }}</text>
      <text class="form-field__link" @tap="emit('upload')">{{ uploadLinkText }}</text>
    </view>
    <text v-else class="form-field__label">{{ label }}</text>

    <view class="media-grid" :class="`media-grid--${size}`">
      <view v-for="(item, index) in items" :key="`${item}-${index}`" class="media-grid__item">
        <image
          class="media-grid__thumb"
          :src="item"
          mode="aspectFill"
          @tap="previewable && onPreview(item)"
        />
        <view v-if="canRemove" class="media-grid__remove" @tap="emit('remove', index)">
          <AppIcon name="ri-close-line" color="#ffffff" />
        </view>
      </view>

      <view v-if="canUpload" class="media-grid__upload" @tap="emit('upload')">
        <AppIcon :name="uploadIcon" class="media-grid__upload-icon" color="#a3a3a3" />
        <text class="media-grid__upload-text">{{ uploadText }}</text>
      </view>
    </view>
  </view>
</template>
