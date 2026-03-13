<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/common/app-icon.vue'
import BaseSheet from '@/components/common/BaseSheet.vue'
import type { Building, CheckItem, InspectionCategory, TaskDetail } from '@/shared/types/task'

type ViewMode = 'risk' | 'building'

const props = defineProps<{
  visible: boolean
  task: TaskDetail | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-item', payload: { item: CheckItem; buildingName?: string; categoryName?: string }): void
}>()

const viewMode = ref<ViewMode>('risk')

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    viewMode.value = 'risk'
  },
)

const buildings = computed<Building[]>(() => {
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

function itemResultLabel(status: CheckItem['status']) {
  if (status === 'normal') return '一切正常'
  if (status === 'focus') return '需重点关注'
  if (status === 'risk') return '存在风险'
  return '未检查'
}

function itemStatusIcon(status: CheckItem['status']) {
  if (status === 'normal') return 'ri-checkbox-circle-fill'
  if (status === 'focus') return 'ri-alert-line'
  if (status === 'risk') return 'ri-error-warning-fill'
  return 'ri-checkbox-blank-circle-line'
}

function formatCompletedAt(completedAt: string | undefined) {
  if (!completedAt) return ''
  const [year, month, day] = completedAt.split('-').map(Number)
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return completedAt
  return `${year} 年 ${month} 月 ${day} 日完成`
}

const headerSubtext = computed(() => formatCompletedAt(props.task?.completedAt))

type ReportEntry = {
  building: Building
  category: InspectionCategory
  item: CheckItem
}

const byRiskGroups = computed(() => {
  const risk: ReportEntry[] = []
  const focus: ReportEntry[] = []
  const normal: ReportEntry[] = []

  for (const building of buildings.value) {
    for (const category of building.categories) {
      for (const item of category.items) {
        if (item.status === 'unchecked') continue
        const entry = { building, category, item }
        if (item.status === 'risk') risk.push(entry)
        else if (item.status === 'focus') focus.push(entry)
        else normal.push(entry)
      }
    }
  }

  return [
    { key: 'risk' as const, label: '存在风险', count: risk.length, entries: risk },
    { key: 'focus' as const, label: '需重点关注', count: focus.length, entries: focus },
    { key: 'normal' as const, label: '一切正常', count: normal.length, entries: normal },
  ].filter((group) => group.count > 0)
})

const buildingGroups = computed(() =>
  buildings.value
    .map((building) => {
      const categories = building.categories
        .map((category) => ({
          ...category,
          items: category.items.filter((item) => item.status !== 'unchecked'),
        }))
        .filter((category) => category.items.length > 0)
      const total = categories.reduce((sum, category) => sum + category.items.length, 0)
      return { ...building, categories, total }
    })
    .filter((building) => building.total > 0),
)
</script>

<template>
  <BaseSheet
    :visible="visible"
    title="巡检报告"
    :subtitle="headerSubtext || undefined"
    max-height="92vh"
    @close="emit('close')"
  >
    <view class="report-mode-row">
      <view
        class="report-mode-btn"
        :class="{ active: viewMode === 'risk' }"
        @tap="viewMode = 'risk'"
      >
        按风险
      </view>
      <view
        class="report-mode-btn"
        :class="{ active: viewMode === 'building' }"
        @tap="viewMode = 'building'"
      >
        按建筑
      </view>
    </view>

    <scroll-view scroll-y class="report-scroll">
      <view v-if="viewMode === 'risk'" class="report-stack">
        <view
          v-for="group in byRiskGroups"
          :key="group.key"
          class="report-group"
          :class="`report-group--${group.key}`"
        >
          <view class="report-group-head">
            <text class="report-group-title">{{ group.label }}</text>
            <text class="report-group-count">{{ group.count }} 项</text>
          </view>
          <view class="report-group-inner">
            <view
              v-for="(entry, index) in group.entries"
              :key="`${entry.building.id}-${entry.category.id}-${entry.item.id}-${index}`"
              class="report-entry"
              :class="{ divided: index > 0 }"
              @tap="
                emit('open-item', {
                  item: entry.item,
                  buildingName: entry.building.name,
                  categoryName: entry.category.name,
                })
              "
            >
              <view class="report-entry-main">
                <view v-if="group.key === 'risk'" class="report-entry-badge report-entry-badge--risk">
                  <view class="report-entry-risk-mark" />
                </view>
                <AppIcon
                  v-else
                  :name="itemStatusIcon(entry.item.status)"
                  class="report-entry-icon"
                  :class="`report-entry-icon--${group.key}`"
                  :color="group.key === 'normal' ? '#1fc16b' : '#fa7319'"
                />
                <view class="report-entry-copy">
                  <text class="report-entry-name">{{ entry.item.name }}</text>
                  <text v-if="entry.building.name !== '园区整体'" class="report-entry-meta">
                    {{ entry.building.name }} · {{ entry.category.name }}
                  </text>
                </view>
              </view>
              <AppIcon name="ri-arrow-right-s-line" class="report-entry-arrow" color="#a3a3a3" />
            </view>
          </view>
        </view>

        <view v-if="!byRiskGroups.length" class="report-empty">暂无已检查结果</view>
      </view>

      <view v-else class="report-stack">
        <view
          v-for="building in buildingGroups"
          :key="building.id"
          class="report-group report-group--building"
        >
          <view class="report-group-head report-group-head--building">
            <text class="report-group-title report-group-title--building">{{ building.name }}</text>
            <text class="report-group-count">{{ building.total }} 项</text>
          </view>
          <view class="report-group-inner">
            <view
              v-for="category in building.categories"
              :key="category.id"
              class="report-building-section"
            >
              <text class="report-building-title">{{ category.name }}</text>
              <view
                v-for="(item, index) in category.items"
                :key="item.id"
                class="report-entry"
                :class="{ divided: index > 0 }"
                @tap="
                  emit('open-item', {
                    item,
                    buildingName: building.name,
                    categoryName: category.name,
                  })
                "
              >
                <view class="report-entry-main">
                  <view v-if="item.status === 'risk'" class="report-entry-badge report-entry-badge--risk">
                    <view class="report-entry-risk-mark" />
                  </view>
                  <AppIcon
                    v-else
                    :name="itemStatusIcon(item.status)"
                    class="report-entry-icon"
                    :class="`report-entry-icon--${item.status}`"
                    :color="item.status === 'normal' ? '#1fc16b' : item.status === 'focus' ? '#fa7319' : '#a3a3a3'"
                  />
                  <text class="report-entry-name">{{ item.name }}</text>
                </view>
                <view class="report-entry-side">
                  <text class="report-entry-result" :class="`report-entry-result--${item.status}`">
                    {{ itemResultLabel(item.status) }}
                  </text>
                  <AppIcon name="ri-arrow-right-s-line" class="report-entry-arrow" color="#a3a3a3" />
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-if="!buildingGroups.length" class="report-empty">暂无已检查结果</view>
      </view>
    </scroll-view>
  </BaseSheet>
</template>

<style scoped>
.report-mode-row {
  padding: 0 32rpx 24rpx;
  display: flex;
  gap: 16rpx;
}

.report-mode-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-secondary);
  font-size: 26rpx;
  line-height: 40rpx;
  font-weight: 500;
}

.theme-dark .report-mode-btn {
  background: rgba(255, 255, 255, 0.1);
}

.report-mode-btn.active {
  background: var(--text-primary);
  color: var(--bg-card);
}

.report-scroll {
  max-height: 70vh;
  padding: 0 32rpx calc(env(safe-area-inset-bottom, 0px) + 24rpx);
  box-sizing: border-box;
}

.report-stack {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.report-group {
  border: 1px solid rgba(23, 23, 23, 0.08);
  border-radius: 24rpx;
  padding: 8rpx;
}

.report-group--risk {
  border-color: rgba(229, 72, 77, 0.3);
  background: #fef2f2;
}

.report-group--focus {
  border-color: rgba(250, 115, 25, 0.3);
  background: #fff7ed;
}

.report-group--normal {
  border-color: rgba(31, 193, 107, 0.2);
  background: #f0fdf4;
}

.report-group--building {
  border-color: var(--border-subtle);
  background: var(--bg-soft);
}

.theme-dark .report-group--risk {
  border-color: rgba(229, 72, 77, 0.4);
  background: rgba(229, 72, 77, 0.15);
}

.theme-dark .report-group--focus {
  border-color: rgba(250, 115, 25, 0.4);
  background: rgba(250, 115, 25, 0.15);
}

.theme-dark .report-group--normal {
  border-color: rgba(31, 193, 107, 0.22);
  background: rgba(31, 193, 107, 0.15);
}

.report-group-head {
  padding: 18rpx 16rpx 18rpx 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.report-group-head--building {
  padding-top: 20rpx;
}

.report-group-title {
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 600;
}

.report-group--risk .report-group-title {
  color: var(--status-danger);
}

.report-group--focus .report-group-title {
  color: var(--status-warning);
}

.report-group--normal .report-group-title {
  color: var(--status-success);
}

.report-group-title--building {
  color: var(--text-primary);
}

.report-group-count {
  font-size: 22rpx;
  line-height: 32rpx;
  font-weight: 500;
  color: var(--text-secondary);
}

.report-group-inner {
  overflow: hidden;
  border-radius: 18rpx;
  background: var(--bg-card);
}

.report-building-section {
  padding: 20rpx 24rpx 8rpx;
}

.report-building-section + .report-building-section {
  border-top: 1px solid var(--border-subtle);
}

.report-building-title {
  display: block;
  margin-bottom: 8rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 500;
  color: var(--text-secondary);
}

.report-entry {
  min-height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.report-group--risk .report-entry,
.report-group--focus .report-entry,
.report-group--normal .report-entry {
  padding: 0 24rpx;
  box-sizing: border-box;
}

.report-entry.divided {
  position: relative;
}

.report-entry.divided::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: var(--border-subtle);
}

.report-group--risk .report-entry.divided::before,
.report-group--focus .report-entry.divided::before,
.report-group--normal .report-entry.divided::before {
  left: 24rpx;
  right: 24rpx;
}

.report-entry-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.report-entry-copy {
  flex: 1;
  min-width: 0;
}

.report-entry-name {
  display: block;
  font-size: 28rpx;
  line-height: 40rpx;
  color: var(--text-primary);
}

.report-entry-meta {
  display: block;
  margin-top: 2rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  color: var(--text-secondary);
}

.report-entry-side {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: none;
}

.report-entry-result {
  font-size: 24rpx;
  line-height: 36rpx;
}

.report-entry-result--normal {
  color: var(--status-success);
}

.report-entry-result--focus {
  color: var(--status-warning);
}

.report-entry-result--risk {
  color: var(--status-danger);
}

.report-entry-arrow {
  width: 36rpx;
  height: 36rpx;
  flex: none;
}

.report-entry-icon {
  width: 28rpx;
  height: 28rpx;
  flex: none;
  display: block;
}

.report-entry-badge {
  width: 28rpx;
  height: 28rpx;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.report-entry-badge--risk {
  background: var(--status-danger);
}

.report-entry-icon--normal {
  transform: scale(1.06);
}

.report-entry-icon--focus {
  transform: scale(1.22) translateY(-0.5px);
}

.report-entry-risk-mark {
  position: relative;
  width: 2px;
  height: 8px;
  border-radius: 999px;
  background: #ffffff;
  transform: translateY(-0.5px);
}

.report-entry-risk-mark::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -3px;
  width: 2px;
  height: 2px;
  margin-left: -1px;
  border-radius: 999px;
  background: #ffffff;
}

.report-entry-icon--unchecked {
  transform: scale(1.02);
}

.report-empty {
  border-radius: 20rpx;
  border: 1px dashed var(--border-strong);
  background: var(--bg-muted);
  padding: 40rpx 24rpx;
  text-align: center;
  font-size: 24rpx;
  line-height: 36rpx;
  color: var(--text-quaternary);
}
</style>
