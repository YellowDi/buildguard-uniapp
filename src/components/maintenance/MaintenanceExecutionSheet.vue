<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseSheet from '@/components/common/BaseSheet.vue'
import { chooseMedia } from '@/services/platform/media'

const props = defineProps<{
  visible: boolean
  mode: 'before' | 'after'
  beforeMedia: string[]
  afterMedia: string[]
  executionNote: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { beforeMedia: string[]; afterMedia: string[]; executionNote: string }): void
}>()

const localBeforeMedia = ref<string[]>([])
const localAfterMedia = ref<string[]>([])
const localExecutionNote = ref('')

const title = computed(() => (props.mode === 'before' ? '提交开工记录' : '填写维修结果'))
const subtitle = computed(() =>
  props.mode === 'before'
    ? '先上传维修前照片或视频，提交后即可开始维修。'
    : '上传维修后照片或视频，并填写维修文字说明。',
)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    localBeforeMedia.value = [...props.beforeMedia]
    localAfterMedia.value = [...props.afterMedia]
    localExecutionNote.value = props.executionNote
  },
  { immediate: true },
)

async function onChoose(target: 'before' | 'after') {
  const selected = await chooseMedia(9)
  if (target === 'before') {
    localBeforeMedia.value = [...localBeforeMedia.value, ...selected]
    return
  }
  localAfterMedia.value = [...localAfterMedia.value, ...selected]
}

function removeMedia(target: 'before' | 'after', index: number) {
  const list = target === 'before' ? localBeforeMedia.value : localAfterMedia.value
  list.splice(index, 1)
}

function submit() {
  if (props.mode === 'before' && localBeforeMedia.value.length === 0) {
    uni.showToast({ title: '请先上传维修前记录', icon: 'none' })
    return
  }
  if (props.mode === 'after' && (localAfterMedia.value.length === 0 || !localExecutionNote.value.trim())) {
    uni.showToast({ title: '请完善维修结果', icon: 'none' })
    return
  }
  emit('save', {
    beforeMedia: [...localBeforeMedia.value],
    afterMedia: [...localAfterMedia.value],
    executionNote: localExecutionNote.value.trim(),
  })
}
</script>

<template>
  <BaseSheet :visible="visible" :title="title" :subtitle="subtitle" max-height="90vh" @close="emit('close')">
    <scroll-view scroll-y class="sheet-scroll">
      <view class="field-group">
        <view class="field-head">
          <text class="field-label">维修前照片 / 视频</text>
          <text v-if="mode === 'before'" class="field-link" @tap="onChoose('before')">上传</text>
        </view>
        <view class="media-grid">
          <view v-for="(media, index) in localBeforeMedia" :key="`${media}-${index}`" class="media-card">
            <image class="media-image" :src="media" mode="aspectFill" />
            <view v-if="mode === 'before'" class="remove-dot" @tap="removeMedia('before', index)">
              <text class="app-icon ri-close-line" />
            </view>
          </view>
          <view v-if="mode === 'before'" class="media-upload" @tap="onChoose('before')">
            <text class="app-icon ri-camera-line upload-icon" />
            <text class="upload-text">上传前记录</text>
          </view>
        </view>
      </view>

      <view v-if="mode === 'after'" class="field-group">
        <view class="field-head">
          <text class="field-label">维修后照片 / 视频</text>
          <text class="field-link" @tap="onChoose('after')">上传</text>
        </view>
        <view class="media-grid">
          <view v-for="(media, index) in localAfterMedia" :key="`${media}-${index}`" class="media-card">
            <image class="media-image" :src="media" mode="aspectFill" />
            <view class="remove-dot" @tap="removeMedia('after', index)">
              <text class="app-icon ri-close-line" />
            </view>
          </view>
          <view class="media-upload" @tap="onChoose('after')">
            <text class="app-icon ri-video-add-line upload-icon" />
            <text class="upload-text">上传后记录</text>
          </view>
        </view>
      </view>

      <view v-if="mode === 'after'" class="field-group">
        <text class="field-label">维修文字说明</text>
        <textarea
          v-model="localExecutionNote"
          class="text-area"
          placeholder="请填写维修处理过程、替换内容、复测结果等说明。"
          maxlength="500"
        />
      </view>
    </scroll-view>

    <view class="sheet-footer safe-bottom">
      <view class="sheet-actions">
        <view class="btn btn-secondary action-btn" @tap="emit('close')">返回修改</view>
        <view class="btn btn-primary action-btn" @tap="submit">
          {{ mode === 'before' ? '提交并开始维修' : '生成维修报告' }}
        </view>
      </view>
    </view>
  </BaseSheet>
</template>

<style scoped>
.sheet-scroll {
  max-height: 62vh;
  padding: 0 32rpx 24rpx;
}

.field-group {
  margin-bottom: 28rpx;
}

.field-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14rpx;
}

.field-label {
  font-size: 24rpx;
  line-height: 36rpx;
  color: #171717;
}

.field-link {
  font-size: 24rpx;
  color: #006adc;
}

.media-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.media-card,
.media-upload {
  width: 176rpx;
  height: 176rpx;
  border-radius: 22rpx;
  position: relative;
  overflow: hidden;
}

.media-card {
  background: #f5f5f5;
}

.media-image {
  width: 100%;
  height: 100%;
}

.media-upload {
  border: 1px dashed #d4d4d4;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.upload-icon {
  font-size: 44rpx;
  color: #a3a3a3;
}

.upload-text {
  font-size: 22rpx;
  color: #a3a3a3;
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

.text-area {
  width: 100%;
  min-height: 180rpx;
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

.sheet-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
}
</style>
