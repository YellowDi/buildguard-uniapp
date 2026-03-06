<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
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
const lightboxVisible = ref(false)
const activePhotoIndex = ref(0)
const zoomScale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const lightboxViewport = ref<HTMLElement | null>(null)
const photos = computed(() => props.entry?.item.photos ?? [])

let pinchStartDistance = 0
let pinchStartScale = 1
let pinchStartMidX = 0
let pinchStartMidY = 0
let pinchStartTranslateX = 0
let pinchStartTranslateY = 0
let dragStartX = 0
let dragStartY = 0
let dragStartTranslateX = 0
let dragStartTranslateY = 0
let swipeStartX = 0
let swipeStartY = 0
let lastTouchX = 0
let lastTouchY = 0
let pinching = false

const MIN_SCALE = 1
const MAX_SCALE = 4

watch(() => props.visible, (val) => {
  if (val) lock()
  else {
    unlock()
    closeLightbox()
  }
}, { immediate: true })

watch(() => props.entry?.item.id, () => {
  closeLightbox()
})

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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getDistance(t1: Touch, t2: Touch) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
}

function getMidpoint(t1: Touch, t2: Touch) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  }
}

function clampTranslate() {
  const viewport = lightboxViewport.value
  if (!viewport || zoomScale.value <= 1) {
    translateX.value = 0
    translateY.value = 0
    return
  }
  const maxX = (viewport.clientWidth * (zoomScale.value - 1)) / 2
  const maxY = (viewport.clientHeight * (zoomScale.value - 1)) / 2
  translateX.value = clamp(translateX.value, -maxX, maxX)
  translateY.value = clamp(translateY.value, -maxY, maxY)
}

function resetTransform() {
  zoomScale.value = 1
  translateX.value = 0
  translateY.value = 0
}

function openLightbox(index: number) {
  if (!photos.value.length) return
  activePhotoIndex.value = index
  resetTransform()
  lightboxVisible.value = true
}

function closeLightbox() {
  lightboxVisible.value = false
  resetTransform()
}

function nextPhoto() {
  if (!photos.value.length) return
  activePhotoIndex.value = (activePhotoIndex.value + 1) % photos.value.length
  resetTransform()
}

function prevPhoto() {
  if (!photos.value.length) return
  activePhotoIndex.value = (activePhotoIndex.value - 1 + photos.value.length) % photos.value.length
  resetTransform()
}

function handleLightboxKeydown(event: KeyboardEvent) {
  if (!lightboxVisible.value) return
  if (event.key === 'Escape') closeLightbox()
  if (event.key === 'ArrowRight') nextPhoto()
  if (event.key === 'ArrowLeft') prevPhoto()
}

function onImageTouchStart(event: TouchEvent) {
  if (!lightboxVisible.value) return
  if (event.touches.length === 2) {
    pinching = true
    const [t1, t2] = [event.touches[0], event.touches[1]]
    pinchStartDistance = getDistance(t1, t2)
    pinchStartScale = zoomScale.value
    const mid = getMidpoint(t1, t2)
    pinchStartMidX = mid.x
    pinchStartMidY = mid.y
    pinchStartTranslateX = translateX.value
    pinchStartTranslateY = translateY.value
    return
  }

  if (event.touches.length === 1) {
    const t = event.touches[0]
    dragStartX = t.clientX
    dragStartY = t.clientY
    dragStartTranslateX = translateX.value
    dragStartTranslateY = translateY.value
    swipeStartX = t.clientX
    swipeStartY = t.clientY
    lastTouchX = t.clientX
    lastTouchY = t.clientY
  }
}

function onImageTouchMove(event: TouchEvent) {
  if (!lightboxVisible.value) return

  if (pinching && event.touches.length === 2) {
    event.preventDefault()
    const [t1, t2] = [event.touches[0], event.touches[1]]
    const distance = getDistance(t1, t2)
    if (!pinchStartDistance) return
    zoomScale.value = clamp((distance / pinchStartDistance) * pinchStartScale, MIN_SCALE, MAX_SCALE)
    const mid = getMidpoint(t1, t2)
    translateX.value = pinchStartTranslateX + (mid.x - pinchStartMidX)
    translateY.value = pinchStartTranslateY + (mid.y - pinchStartMidY)
    clampTranslate()
    return
  }

  if (event.touches.length !== 1) return

  const t = event.touches[0]
  lastTouchX = t.clientX
  lastTouchY = t.clientY
  if (zoomScale.value > 1) {
    event.preventDefault()
    translateX.value = dragStartTranslateX + (t.clientX - dragStartX)
    translateY.value = dragStartTranslateY + (t.clientY - dragStartY)
    clampTranslate()
  }
}

function onImageTouchEnd(event: TouchEvent) {
  if (!lightboxVisible.value) return
  if (event.touches.length < 2) pinching = false

  if (zoomScale.value > 1) return
  const deltaX = lastTouchX - swipeStartX
  const deltaY = lastTouchY - swipeStartY
  if (Math.abs(deltaX) < 56 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return
  if (deltaX < 0) nextPhoto()
  else prevPhoto()
}

watch(lightboxVisible, (visible) => {
  if (visible) {
    window.addEventListener('keydown', handleLightboxKeydown)
  } else {
    window.removeEventListener('keydown', handleLightboxKeydown)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleLightboxKeydown)
})
</script>

<template>
  <Teleport to="body">
    <!-- 叠层遮罩：仅关闭本浮窗，不关底层报告浮窗 -->
    <Transition name="overlay">
      <div
        v-if="visible"
        class="sheet-overlay fixed inset-0 z-[70] bg-black/30"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="sheet">
      <div
        v-if="visible && entry"
        class="drawer-panel z-[70]"
        style="max-height: 88vh"
      >
        <div class="drawer-handle-wrap">
          <div class="drawer-handle-bar" />
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
            class="drawer-close-btn shrink-0"
            @click="emit('close')"
          >
            <i class="ri-close-line drawer-close-icon" />
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
              <button
                v-for="(photo, idx) in entry.item.photos"
                :key="idx"
                type="button"
                class="group relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-lg bg-[#F0F0F0] dark:bg-[#404040]"
                aria-label="查看现场照片大图"
                @click="openLightbox(idx)"
              >
                <img
                  :src="photo"
                  alt="现场照片"
                  class="h-full w-full object-cover transition-transform duration-300 group-active:scale-[1.03]"
                />
                <span class="pointer-events-none absolute inset-x-0 bottom-0 bg-black/45 px-1.5 py-0.5 text-center text-[11px] leading-[14px] text-white">
                  点击查看
                </span>
              </button>
            </div>
            <p v-else class="rounded-lg border border-dashed border-[#D4D4D4] dark:border-[#525252] bg-[#FAFAFA] dark:bg-[#404040]/50 py-6 text-center text-[13px] text-[#A3A3A3]">
              暂无现场照片
            </p>
          </div>

          <!-- 问题描述 -->
          <div class="mb-4">
            <span class="mb-1.5 block text-[13px] font-medium leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">问题描述</span>
            <div class="rounded-lg bg-[#F5F5F5] dark:bg-[#404040]/70 px-3 py-2.5">
              <p
                v-if="entry.item.description"
                class="text-[14px] leading-[22px] text-[#171717] dark:text-[#E5E5E5]"
              >
                {{ entry.item.description }}
              </p>
              <p
                v-else
                class="text-[13px] leading-[20px] text-[#A3A3A3] italic"
              >
                未填写问题描述
              </p>
            </div>
          </div>

          <!-- 影响评估 -->
          <div>
            <span class="mb-1.5 block text-[13px] font-medium leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">影响评估</span>
            <div class="rounded-lg bg-[#F5F5F5] dark:bg-[#404040]/70 px-3 py-2.5">
              <p
                v-if="entry.item.impact"
                class="text-[14px] leading-[22px] text-[#171717] dark:text-[#E5E5E5]"
              >
                {{ entry.item.impact }}
              </p>
              <p
                v-else
                class="text-[13px] leading-[20px] text-[#A3A3A3] italic"
              >
                未填写影响评估
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="overlay">
      <div
        v-if="lightboxVisible && photos.length"
        class="fixed inset-0 z-[80] bg-black/95"
      >
        <div class="flex h-full flex-col">
          <div class="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3">
            <span class="text-[13px] text-white/80">
              {{ activePhotoIndex + 1 }} / {{ photos.length }}
            </span>
            <button
              type="button"
              class="drawer-close-btn"
              aria-label="关闭图片预览"
              @click="closeLightbox"
            >
              <i class="ri-close-line drawer-close-icon" />
            </button>
          </div>

          <div
            ref="lightboxViewport"
            class="relative flex-1 touch-none overflow-hidden"
            @touchstart="onImageTouchStart"
            @touchmove="onImageTouchMove"
            @touchend="onImageTouchEnd"
            @touchcancel="onImageTouchEnd"
          >
            <img
              :src="photos[activePhotoIndex]"
              alt="现场照片大图"
              class="h-full w-full select-none object-contain"
              :style="{
                transform: `translate(${translateX}px, ${translateY}px) scale(${zoomScale})`,
                transition: pinching ? 'none' : 'transform 120ms ease-out',
              }"
              draggable="false"
            />

            <button
              v-if="photos.length > 1"
              type="button"
              class="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white active:bg-white/30"
              aria-label="上一张"
              @click="prevPhoto"
            >
              <i class="ri-arrow-left-s-line text-[22px]" />
            </button>

            <button
              v-if="photos.length > 1"
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white active:bg-white/30"
              aria-label="下一张"
              @click="nextPhoto"
            >
              <i class="ri-arrow-right-s-line text-[22px]" />
            </button>
          </div>

          <div class="pb-[max(env(safe-area-inset-bottom),16px)] px-4 pt-3 text-center text-[12px] text-white/70">
            双指缩放，左右滑动切换
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
