<script setup lang="ts">
import { watch } from 'vue'
import type { TaskDetail, Building, CheckItem } from '../../types/task'
import { useBodyScrollLock } from '../../composables/useBodyScrollLock'

const props = defineProps<{
  visible: boolean
  task: TaskDetail | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
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

/** 扁平化所有建筑下的已检查项，用于列表展示 */
function getAllCheckedItems(task: TaskDetail | null): { building: Building; item: CheckItem }[] {
  if (!task) return []
  const buildings = task.buildings?.length ? task.buildings : (task.categories ? [{ id: 0, name: '园区整体', categories: task.categories }] : [])
  const list: { building: Building; item: CheckItem }[] = []
  for (const b of buildings) {
    for (const cat of b.categories) {
      for (const item of cat.items) {
        if (item.status !== 'unchecked') {
          list.push({ building: b, item })
        }
      }
    }
  }
  return list
}

const checkedList = () => getAllCheckedItems(props.task)
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
        class="fixed inset-x-0 bottom-0 z-[60] mx-auto flex w-full max-w-[430px] flex-col rounded-t-2xl bg-white dark:bg-[#262626]"
        style="max-height: 85vh"
      >
        <div class="flex justify-center pt-2 pb-1">
          <div class="h-1 w-9 rounded-full bg-[#D4D4D4] dark:bg-[#525252]" />
        </div>

        <div class="flex items-center justify-between px-4 pb-3">
          <h3 class="text-[16px] font-semibold leading-[24px] text-[#171717] dark:text-[#E5E5E5]">
            确认巡检结果
          </h3>
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5F5F5] dark:bg-[#404040] transition-colors active:bg-[#E5E5E5] dark:active:bg-[#525252]"
            @click="emit('close')"
          >
            <i class="ri-close-line text-[16px] leading-[16px] text-[#5C5C5C] dark:text-[#A3A3A3]" />
          </button>
        </div>

        <p class="px-4 pb-3 text-[13px] leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">
          请核对下方巡检结果，确认无误后点击「确认提交」完成本次巡检。
        </p>

        <div class="flex-1 overflow-y-auto px-4 pb-4">
          <ul class="flex flex-col gap-1">
            <li
              v-for="(entry, idx) in checkedList()"
              :key="`${entry.building.id}-${entry.item.id}-${idx}`"
              class="flex items-center gap-2 rounded-lg border border-[#EBEBEB] dark:border-white/10 bg-[#FAFAFA] dark:bg-[#404040] px-3 py-2.5"
            >
              <i
                :class="[itemStatusIcon(entry.item.status), 'text-[18px] leading-[18px] shrink-0', itemStatusColor(entry.item.status)]"
              />
              <span class="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-[#171717] dark:text-[#E5E5E5]">
                {{ entry.building.name !== '园区整体' ? `${entry.building.name} · ` : '' }}{{ entry.item.name }}
              </span>
              <span
                class="shrink-0 text-[13px] font-medium leading-[20px]"
                :class="itemStatusColor(entry.item.status)"
              >
                {{ itemResultLabel(entry.item.status) }}
              </span>
            </li>
          </ul>
        </div>

        <div class="shrink-0 border-t border-[#F0F0F0] dark:border-white/10 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] flex gap-2">
          <button
            type="button"
            class="flex h-11 flex-1 items-center justify-center rounded-lg bg-[rgba(0,0,0,0.06)] dark:bg-white/10 text-[#5C5C5C] dark:text-[#A3A3A3] transition-colors active:opacity-90"
            @click="emit('close')"
          >
            <span class="text-[15px] font-medium leading-[20px]">返回修改</span>
          </button>
          <button
            type="button"
            class="flex h-11 flex-1 items-center justify-center rounded-lg bg-[#171717] dark:bg-[#E5E5E5] text-white dark:text-[#171717] transition-colors active:bg-[#333333] dark:active:bg-[#D4D4D4]"
            @click="emit('confirm')"
          >
            <span class="text-[15px] font-medium leading-[20px]">确认提交</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-overlay {
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
