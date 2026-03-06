<script setup lang="ts">
import { watch } from 'vue'
import type { CheckItem } from '../../types/task'
import { useBodyScrollLock } from '../../composables/useBodyScrollLock'

export type DetailEntry = {
  buildingName: string
  categoryName: string
  item: CheckItem
}

const props = defineProps<{
  visible: boolean
  entry: DetailEntry | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { lock, unlock } = useBodyScrollLock()

watch(() => props.visible, (val) => {
  if (val) lock()
  else unlock()
}, { immediate: true })

function itemResultLabel(status: string) {
  switch (status) {
    case 'normal': return '一切正常'
    case 'focus': return '需重点关注'
    case 'risk': return '存在风险'
    default: return '未检查'
  }
}

function itemStatusColor(status: string) {
  switch (status) {
    case 'normal': return 'text-[#1FC16B]'
    case 'focus': return 'text-[#FA7319]'
    case 'risk': return 'text-[#E5484D]'
    default: return 'text-[#5C5C5C]'
  }
}

function itemStatusIcon(status: string) {
  switch (status) {
    case 'normal': return 'ri-checkbox-circle-fill'
    case 'focus': return 'ri-alert-line'
    case 'risk': return 'ri-error-warning-fill'
    default: return 'ri-checkbox-blank-circle-line'
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- 叠层遮罩：仅关闭本浮窗，不关底层报告浮窗 -->
    <Transition name="overlay">
      <div
        v-if="visible"
        class="detail-overlay fixed inset-0 z-[70] bg-black/30"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="sheet">
      <div
        v-if="visible && entry"
        class="fixed inset-x-0 bottom-0 z-[70] mx-auto flex w-full max-w-[430px] flex-col rounded-t-2xl bg-white dark:bg-[#262626]"
        style="max-height: 88vh"
      >
        <div class="flex justify-center pt-2 pb-1">
          <div class="h-1 w-9 rounded-full bg-[#D4D4D4] dark:bg-[#525252]" />
        </div>

        <div class="flex items-center justify-between px-4 pb-3">
          <div class="min-w-0 flex-1 pr-2">
            <h3 class="truncate text-[16px] font-semibold leading-[24px] text-[#171717] dark:text-[#E5E5E5]">
              {{ entry.item.name }}
            </h3>
            <p v-if="entry.buildingName !== '园区整体' || entry.categoryName" class="mt-0.5 truncate text-[12px] leading-[18px] text-[#5C5C5C] dark:text-[#A3A3A3]">
              <template v-if="entry.buildingName !== '园区整体'">{{ entry.buildingName }}</template>
              <template v-if="entry.buildingName !== '园区整体' && entry.categoryName"> · </template>
              <template v-if="entry.categoryName">{{ entry.categoryName }}</template>
            </p>
          </div>
          <button
            type="button"
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] dark:bg-[#404040] transition-colors active:bg-[#E5E5E5] dark:active:bg-[#525252]"
            @click="emit('close')"
          >
            <i class="ri-close-line text-[16px] leading-[16px] text-[#5C5C5C] dark:text-[#A3A3A3]" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <!-- 情况状态 -->
          <div v-if="entry.item.status !== 'unchecked'" class="mb-4">
            <span class="mb-1.5 block text-[13px] font-medium leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">情况状态</span>
            <div class="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E5E5] dark:border-white/20 bg-[#FAFAFA] dark:bg-[#404040] px-3 py-2">
              <i :class="[itemStatusIcon(entry.item.status), 'text-[18px]', itemStatusColor(entry.item.status)]" />
              <span class="text-[14px] font-medium" :class="itemStatusColor(entry.item.status)">
                {{ itemResultLabel(entry.item.status) }}
              </span>
            </div>
          </div>

          <!-- 现场照片 -->
          <div class="mb-4">
            <span class="mb-1.5 block text-[13px] font-medium leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">现场照片</span>
            <div v-if="entry.item.photos?.length" class="flex flex-wrap gap-2">
              <div
                v-for="(photo, idx) in entry.item.photos"
                :key="idx"
                class="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-lg bg-[#F0F0F0] dark:bg-[#404040]"
              >
                <img
                  :src="photo"
                  alt="现场照片"
                  class="h-full w-full object-cover"
                />
              </div>
            </div>
            <p v-else class="rounded-lg border border-dashed border-[#D4D4D4] dark:border-[#525252] bg-[#FAFAFA] dark:bg-[#404040]/50 py-6 text-center text-[13px] text-[#A3A3A3]">
              暂无现场照片
            </p>
          </div>

          <!-- 问题描述 -->
          <div class="mb-4">
            <span class="mb-1.5 block text-[13px] font-medium leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">问题描述</span>
            <p
              v-if="entry.item.description"
              class="rounded-lg border border-[#E5E5E5] dark:border-white/20 bg-[#FAFAFA] dark:bg-[#404040] px-3 py-2.5 text-[14px] leading-[22px] text-[#171717] dark:text-[#E5E5E5]"
            >
              {{ entry.item.description }}
            </p>
            <p
              v-else
              class="rounded-lg border border-[#E5E5E5] dark:border-white/20 bg-[#FAFAFA] dark:bg-[#404040] px-3 py-2.5 text-[14px] leading-[22px] text-[#A3A3A3]"
            >
              暂无描述
            </p>
          </div>

          <!-- 影响评估 -->
          <div>
            <span class="mb-1.5 block text-[13px] font-medium leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">影响评估</span>
            <p
              v-if="entry.item.impact"
              class="rounded-lg border border-[#E5E5E5] dark:border-white/20 bg-[#FAFAFA] dark:bg-[#404040] px-3 py-2.5 text-[14px] leading-[22px] text-[#171717] dark:text-[#E5E5E5]"
            >
              {{ entry.item.impact }}
            </p>
            <p
              v-else
              class="rounded-lg border border-[#E5E5E5] dark:border-white/20 bg-[#FAFAFA] dark:bg-[#404040] px-3 py-2.5 text-[14px] leading-[22px] text-[#A3A3A3]"
            >
              暂无评估
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.detail-overlay {
  touch-action: none;
  overflow: hidden;
}

.overlay-enter-active {
  transition: opacity 320ms ease;
}
.overlay-leave-active {
  transition: opacity 180ms ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

@keyframes sheet-in {
  0% {
    transform: translateY(60%) scale(0.8);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes sheet-out {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(60%) scale(0.8);
    opacity: 0;
  }
}

.sheet-enter-active {
  animation: sheet-in 480ms cubic-bezier(0.16, 1, 0.3, 1) both;
  transform-origin: bottom center;
}

.sheet-leave-active {
  animation: sheet-out 220ms cubic-bezier(0.4, 0, 0.7, 0.2) both;
  transform-origin: bottom center;
}
</style>
