<script setup lang="ts">
import { computed } from 'vue'
import BaseSheet from '@/components/common/BaseSheet.vue'
import type { CheckItem, TaskDetail } from '@/shared/types/task'
import { previewImages } from '@/services/platform/media'

const props = defineProps<{
  visible: boolean
  task: TaskDetail | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const buildings = computed(() => {
  if (!props.task) return []
  if (props.task.buildings?.length) return props.task.buildings
  if (props.task.categories?.length) {
    return [
      {
        id: 0,
        name: '园区整体',
        categories: props.task.categories,
      },
    ]
  }
  return []
})

function statusText(item: CheckItem) {
  switch (item.status) {
    case 'normal':
      return '一切正常'
    case 'focus':
      return '需重点关注'
    case 'risk':
      return '存在风险'
    default:
      return '未检查'
  }
}

function statusClass(item: CheckItem) {
  switch (item.status) {
    case 'normal':
      return 'ok'
    case 'focus':
      return 'focus'
    case 'risk':
      return 'risk'
    default:
      return ''
  }
}
</script>

<template>
  <BaseSheet
    :visible="visible"
    title="巡检报告"
    subtitle="按建筑和巡检项目查看本次填报结果"
    max-height="90vh"
    @close="emit('close')"
  >
    <scroll-view scroll-y class="report-scroll">
      <view v-for="building in buildings" :key="building.id" class="report-building">
        <text class="report-building-name">{{ building.name }}</text>
        <view v-for="category in building.categories" :key="category.id" class="report-category card">
          <view class="report-head">
            <text class="report-title">{{ category.name }}</text>
            <text class="report-desc">{{ category.description }}</text>
          </view>
          <view v-for="item in category.items" :key="item.id" class="report-item">
            <view class="report-item-row">
              <text class="report-item-name">{{ item.name }}</text>
              <text class="report-item-status" :class="statusClass(item)">{{ statusText(item) }}</text>
            </view>
            <text v-if="item.description" class="report-note">{{ item.description }}</text>
            <text v-if="item.impact" class="report-note">影响：{{ item.impact }}</text>
            <view v-if="item.photos?.length" class="thumb-row">
              <image
                v-for="photo in item.photos"
                :key="photo"
                class="thumb"
                :src="photo"
                mode="aspectFill"
                @tap="previewImages(item.photos || [], photo)"
              />
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </BaseSheet>
</template>

<style scoped>
.report-scroll {
  max-height: 70vh;
  padding: 0 32rpx 32rpx;
}

.report-building + .report-building {
  margin-top: 20rpx;
}

.report-building-name {
  display: block;
  margin-bottom: 14rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.report-category {
  padding: 24rpx;
}

.report-category + .report-category {
  margin-top: 16rpx;
}

.report-head {
  margin-bottom: 18rpx;
}

.report-title {
  display: block;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 600;
}

.report-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  color: #737373;
}

.report-item + .report-item {
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 1px solid #ebebeb;
}

.report-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.report-item-name {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  line-height: 38rpx;
}

.report-item-status {
  font-size: 24rpx;
  line-height: 36rpx;
  color: #5c5c5c;
}

.report-item-status.ok {
  color: #1fc16b;
}

.report-item-status.focus {
  color: #fa7319;
}

.report-item-status.risk {
  color: #e5484d;
}

.report-note {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 34rpx;
  color: #5c5c5c;
}

.thumb-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 12rpx;
}

.thumb {
  width: 140rpx;
  height: 140rpx;
  border-radius: 18rpx;
  background: #f5f5f5;
}
</style>
