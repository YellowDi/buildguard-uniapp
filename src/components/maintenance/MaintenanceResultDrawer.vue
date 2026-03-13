<script setup lang="ts">
import { watch } from 'vue'
import { useBodyScrollLock } from '../../composables/useBodyScrollLock'
import type { MaintenanceTaskDetail } from '../../types/maintenance'

const props = defineProps<{
  visible: boolean
  task: MaintenanceTaskDetail | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { lock, unlock } = useBodyScrollLock()

watch(() => props.visible, (val) => {
  if (val) lock()
  else unlock()
}, { immediate: true })

function isVideo(url: string) {
  return url.startsWith('data:video/') || /\.mp4($|\?)/i.test(url) || /\.mov($|\?)/i.test(url) || /\.webm($|\?)/i.test(url)
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
        v-if="visible && task"
        class="drawer-panel z-[60]"
        style="max-height: 90vh"
      >
        <div class="drawer-handle-wrap">
          <div class="drawer-handle-bar" />
        </div>

        <div class="flex items-center justify-between px-4 pb-3">
          <div>
            <h3 class="text-[16px] font-semibold leading-[24px] text-[#171717] dark:text-[#E5E5E5]">
              维修结果
            </h3>
            <p v-if="task.completedAt" class="mt-0.5 text-[12px] leading-[18px] text-[#5C5C5C] dark:text-[#A3A3A3]">
              {{ task.completedAt }} 完成
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
            <p class="text-[13px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">维修前照片 / 视频</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <div
                v-for="media in task.beforeMedia"
                :key="media"
                class="h-[88px] w-[88px] overflow-hidden rounded-xl bg-[#F5F5F5] dark:bg-[#404040]"
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
              </div>
            </div>
          </div>

          <div class="mt-5">
            <p class="text-[13px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">维修后照片 / 视频</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <div
                v-for="media in task.afterMedia"
                :key="media"
                class="h-[88px] w-[88px] overflow-hidden rounded-xl bg-[#F5F5F5] dark:bg-[#404040]"
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
              </div>
            </div>
          </div>

          <div class="mt-5 rounded-xl bg-[#F5F5F5] px-3 py-3 dark:bg-[#404040]">
            <p class="text-[13px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">维修文字说明</p>
            <p class="mt-2 text-[13px] leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">
              {{ task.executionNote || '暂无维修说明。' }}
            </p>
          </div>

          <div v-if="task.completionSummary" class="mt-4 rounded-xl bg-[#F5F5F5] px-3 py-3 dark:bg-[#404040]">
            <p class="text-[13px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">处理结论</p>
            <p class="mt-2 text-[13px] leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">
              {{ task.completionSummary }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
