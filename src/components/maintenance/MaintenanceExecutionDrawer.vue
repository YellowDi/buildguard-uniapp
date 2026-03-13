<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useBodyScrollLock } from '../../composables/useBodyScrollLock'

const props = defineProps<{
  visible: boolean
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
const uploadedFileByUrl = new Map<string, File>()
const { lock, unlock } = useBodyScrollLock()

function isVideo(url: string) {
  return url.startsWith('data:video/') || /\.mp4($|\?)/i.test(url) || /\.mov($|\?)/i.test(url) || /\.webm($|\?)/i.test(url)
}

function revokeUploadedMedia(url: string) {
  if (!uploadedFileByUrl.has(url)) return
  URL.revokeObjectURL(url)
  uploadedFileByUrl.delete(url)
}

function clearUploadedMedia() {
  for (const url of uploadedFileByUrl.keys()) {
    URL.revokeObjectURL(url)
  }
  uploadedFileByUrl.clear()
}

watch(() => props.visible, (val) => {
  if (val) {
    lock()
    localBeforeMedia.value = [...props.beforeMedia]
    localAfterMedia.value = [...props.afterMedia]
    localExecutionNote.value = props.executionNote
  } else {
    unlock()
    clearUploadedMedia()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  clearUploadedMedia()
})

function triggerUpload(target: 'before' | 'after') {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,video/*'
  input.multiple = true
  input.onchange = () => {
    if (!input.files) return
    for (const file of Array.from(input.files)) {
      const url = URL.createObjectURL(file)
      uploadedFileByUrl.set(url, file)
      if (target === 'before') localBeforeMedia.value.push(url)
      else localAfterMedia.value.push(url)
    }
  }
  input.click()
}

function removeMedia(target: 'before' | 'after', index: number) {
  const list = target === 'before' ? localBeforeMedia.value : localAfterMedia.value
  const [removed] = list.splice(index, 1)
  if (removed) revokeUploadedMedia(removed)
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

async function serializeMediaForSave(list: string[]) {
  const serialized = await Promise.all(
    list.map(async (item) => {
      const file = uploadedFileByUrl.get(item)
      if (!file) return item
      return fileToDataUrl(file)
    }),
  )
  return serialized.filter(Boolean)
}

const canSubmit = () =>
  localBeforeMedia.value.length > 0 &&
  localAfterMedia.value.length > 0 &&
  localExecutionNote.value.trim() !== ''

async function handleSave() {
  if (!canSubmit()) {
    window.alert('完成维修前，需上传维修前照片/视频、维修后照片/视频，并填写维修说明。')
    return
  }

  emit('save', {
    beforeMedia: await serializeMediaForSave(localBeforeMedia.value),
    afterMedia: await serializeMediaForSave(localAfterMedia.value),
    executionNote: localExecutionNote.value.trim(),
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="visible"
        class="sheet-overlay fixed inset-0 z-[60] bg-black/40"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="sheet">
      <div
        v-if="visible"
        class="drawer-panel z-[60]"
        style="max-height: 90vh"
      >
        <div class="drawer-handle-wrap">
          <div class="drawer-handle-bar" />
        </div>

        <div class="flex items-center justify-between px-4 pb-3">
          <div>
            <h3 class="text-[16px] font-semibold leading-[24px] text-[#171717] dark:text-[#E5E5E5]">
              填写维修记录
            </h3>
            <p class="mt-0.5 text-[12px] leading-[18px] text-[#5C5C5C] dark:text-[#A3A3A3]">
              需补齐维修前影像、维修后影像和文字说明，作为完工依据。
            </p>
          </div>
          <button
            type="button"
            class="drawer-close-btn shrink-0"
            @click="emit('close')"
          >
            <i class="ri-close-line drawer-close-icon" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <div>
            <div class="flex items-center justify-between">
              <p class="text-[13px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">维修前照片 / 视频</p>
              <button
                type="button"
                class="text-[12px] font-medium leading-[16px] text-[#006ADC] dark:text-[#7DB9FF]"
                @click="triggerUpload('before')"
              >
                上传
              </button>
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <div
                v-for="(media, index) in localBeforeMedia"
                :key="`before-${media}`"
                class="relative h-[88px] w-[88px] overflow-hidden rounded-xl bg-[#F5F5F5] dark:bg-[#404040]"
              >
                <video
                  v-if="isVideo(media)"
                  :src="media"
                  class="h-full w-full object-cover"
                  controls
                  playsinline
                />
                <img
                  v-else
                  :src="media"
                  alt="维修前记录"
                  class="h-full w-full object-cover"
                />
                <button
                  type="button"
                  class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white"
                  @click="removeMedia('before', index)"
                >
                  <i class="ri-close-line text-[12px] leading-[12px]" />
                </button>
              </div>
              <button
                type="button"
                class="flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#D4D4D4] bg-[#FAFAFA] dark:border-[#525252] dark:bg-[#404040]"
                @click="triggerUpload('before')"
              >
                <i class="ri-camera-line text-[22px] leading-[22px] text-[#A3A3A3]" />
                <span class="text-[11px] leading-[14px] text-[#A3A3A3]">上传前记录</span>
              </button>
            </div>
          </div>

          <div class="mt-5">
            <div class="flex items-center justify-between">
              <p class="text-[13px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">维修后照片 / 视频</p>
              <button
                type="button"
                class="text-[12px] font-medium leading-[16px] text-[#006ADC] dark:text-[#7DB9FF]"
                @click="triggerUpload('after')"
              >
                上传
              </button>
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <div
                v-for="(media, index) in localAfterMedia"
                :key="`after-${media}`"
                class="relative h-[88px] w-[88px] overflow-hidden rounded-xl bg-[#F5F5F5] dark:bg-[#404040]"
              >
                <video
                  v-if="isVideo(media)"
                  :src="media"
                  class="h-full w-full object-cover"
                  controls
                  playsinline
                />
                <img
                  v-else
                  :src="media"
                  alt="维修后记录"
                  class="h-full w-full object-cover"
                />
                <button
                  type="button"
                  class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white"
                  @click="removeMedia('after', index)"
                >
                  <i class="ri-close-line text-[12px] leading-[12px]" />
                </button>
              </div>
              <button
                type="button"
                class="flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#D4D4D4] bg-[#FAFAFA] dark:border-[#525252] dark:bg-[#404040]"
                @click="triggerUpload('after')"
              >
                <i class="ri-video-add-line text-[22px] leading-[22px] text-[#A3A3A3]" />
                <span class="text-[11px] leading-[14px] text-[#A3A3A3]">上传后记录</span>
              </button>
            </div>
          </div>

          <div class="mt-5">
            <p class="text-[13px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">维修文字说明</p>
            <textarea
              v-model="localExecutionNote"
              class="mt-2 h-[96px] w-full resize-none rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2.5 text-[14px] leading-[20px] text-[#171717] outline-none placeholder:text-[#A3A3A3] dark:border-white/20 dark:bg-[#404040] dark:text-[#E5E5E5]"
              placeholder="请填写维修处理过程、替换内容、复测结果等说明。"
            />
          </div>
        </div>

        <div class="shrink-0 border-t border-[#F0F0F0] dark:border-white/10 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] flex gap-2">
          <button
            type="button"
            class="btn-base btn-secondary btn-md flex-1"
            @click="emit('close')"
          >
            <span>返回修改</span>
          </button>
          <button
            type="button"
            class="btn-base btn-primary btn-md flex-1"
            @click="handleSave"
          >
            <span>确认完成</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
