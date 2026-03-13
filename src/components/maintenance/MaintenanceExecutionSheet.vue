<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseSheet from '@/components/common/BaseSheet.vue'
import MediaGridField from '@/components/common/media-grid-field.vue'
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
    <scroll-view scroll-y class="sheet-scroll maintenance-execution__scroll">
      <MediaGridField
        label="维修前照片 / 视频"
        :items="localBeforeMedia"
        size="regular"
        upload-text="上传前记录"
        upload-icon="ri-camera-line"
        :can-upload="mode === 'before'"
        :can-remove="mode === 'before'"
        @upload="onChoose('before')"
        @remove="removeMedia('before', $event)"
      />

      <MediaGridField
        v-if="mode === 'after'"
        label="维修后照片 / 视频"
        :items="localAfterMedia"
        size="regular"
        upload-text="上传后记录"
        upload-icon="ri-video-add-line"
        @upload="onChoose('after')"
        @remove="removeMedia('after', $event)"
      />

      <view v-if="mode === 'after'" class="form-field">
        <text class="form-field__label">维修文字说明</text>
        <textarea
          v-model="localExecutionNote"
          class="textarea-card"
          placeholder="请填写维修处理过程、替换内容、复测结果等说明。"
          maxlength="500"
        />
      </view>
    </scroll-view>

    <view class="sheet-footer">
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
.maintenance-execution__scroll {
  max-height: 62vh;
}

.action-btn {
  flex: 1;
}
</style>
