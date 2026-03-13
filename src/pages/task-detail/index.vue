<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onLoad, onPageScroll } from '@dcloudio/uni-app'
import AppIcon from '@/components/common/app-icon.vue'
import InspectionEditorSheet from '@/components/task/InspectionEditorSheet.vue'
import TaskReportSheet from '@/components/task/TaskReportSheet.vue'
import { fetchTaskDetail } from '@/shared/api/task'
import type { Building, CheckItem, InspectionCategory, TaskDetail } from '@/shared/types/task'
import { daysFromToday, formatCompletedAt, parseMonthDay } from '@/shared/utils/date'
import { makePhoneCall, openLocation } from '@/services/platform/device'
import { usePageNavVars } from '@/services/platform/layout'
import { goBack, goInspectionHome } from '@/services/platform/navigation'
import { useTheme } from '@/services/platform/theme'

const taskId = ref(0)
const task = ref<TaskDetail | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const notFound = ref(false)
const expandedCategoryIds = ref<number[]>([])
const selectedBuildingIndex = ref(0)
const activeItem = ref<CheckItem | null>(null)
const editorVisible = ref(false)
const reportVisible = ref(false)
const navScrolled = ref(false)
const navBarVars = usePageNavVars()
const { isDark } = useTheme()

const buildings = computed<Building[]>(() => {
  if (!task.value) return []
  if (task.value.buildings?.length) return task.value.buildings
  if (task.value.categories?.length) {
    return [{ id: 0, name: '园区整体', categories: task.value.categories }]
  }
  return []
})

const currentBuilding = computed(() => buildings.value[selectedBuildingIndex.value] ?? null)

const totalItems = computed(() =>
  buildings.value.reduce((sum, building) => sum + building.categories.reduce((acc, cat) => acc + cat.items.length, 0), 0),
)

const checkedItems = computed(() =>
  buildings.value.reduce(
    (sum, building) =>
      sum +
      building.categories.reduce(
        (acc, cat) => acc + cat.items.filter((item) => item.status !== 'unchecked').length,
        0,
      ),
    0,
  ),
)

const progressPercent = computed(() => (totalItems.value ? Math.round((checkedItems.value / totalItems.value) * 100) : 0))
const sectionTitle = computed(() =>
  currentBuilding.value ? `${currentBuilding.value.name} · 巡检项目` : '巡检项目',
)
type BottomAction = {
  key: 'start' | 'navigate' | 'call' | 'continue' | 'submit' | 'report'
  label: string
  icon: string
  primary?: boolean
  fillRemaining?: boolean
}

const statusLabel = computed(() => {
  if (!task.value) return ''
  if (task.value.status === 'active') return '进行中'
  if (task.value.status === 'pending') return '待完成'
  return '已完成'
})

const statusIconName = computed(() => {
  if (!task.value) return 'ri-time-fill'
  if (task.value.status === 'active') return 'ri-loader-2-line'
  if (task.value.status === 'pending') return 'ri-time-fill'
  return 'ri-checkbox-circle-fill'
})

const statusIconColor = computed(() => {
  if (!task.value) return isDark.value ? '#e5e5e5' : '#171717'
  if (task.value.status === 'pending') return '#fa7319'
  if (task.value.status === 'completed') return '#1fc16b'
  return isDark.value ? '#e5e5e5' : '#171717'
})

const deadlineDisplayText = computed(() => {
  if (!task.value) return ''
  if (task.value.status === 'completed' && task.value.completedAt) {
    return `${formatCompletedAt(task.value.completedAt)} 完成巡检`
  }
  if (task.value.status === 'pending' && task.value.startDate) {
    return `${task.value.startDate} - ${task.value.deadline}`.replace(/前完成$/, '')
  }
  return task.value.deadline
})

const timeRemainingLabel = computed(() => {
  if (!task.value || task.value.status === 'completed') return ''
  if (task.value.status === 'pending') {
    const diffDays = daysFromToday(parseMonthDay(task.value.startDate || ''))
    if (diffDays == null) return ''
    if (diffDays < 0) return '已可开始'
    if (diffDays === 0) return '今天开始'
    return `还有${diffDays}天开始`
  }
  const matches = [...task.value.deadline.matchAll(/(\d+)\s*月\s*(\d+)\s*日/g)]
  const endValue = matches.at(-1)?.[0] ?? task.value.deadline
  const diffDays = daysFromToday(parseMonthDay(endValue))
  if (diffDays == null) return ''
  if (diffDays < 0) return '已逾期'
  if (diffDays === 0) return '今天到期'
  return `还剩${diffDays}天`
})

const firstUncheckedItem = computed(() => {
  const building = currentBuilding.value
  if (!building) return null
  for (const category of building.categories) {
    const item = category.items.find((entry) => entry.status === 'unchecked')
    if (item) return item
  }
  return null
})

const bottomActions = computed<BottomAction[]>(() => {
  if (!task.value) return []
  switch (task.value.status) {
    case 'pending':
      return [
        { key: 'start', label: '开始巡检', icon: 'ri-play-circle-line', primary: true, fillRemaining: true },
        { key: 'navigate', label: '导航过去', icon: 'ri-map-pin-line' },
        { key: 'call', label: '电话联系', icon: 'ri-phone-line' },
      ]
    case 'active':
      if (progressPercent.value === 100) {
        return [
          { key: 'call', label: '电话联系', icon: 'ri-phone-line' },
          { key: 'submit', label: '提交', icon: 'ri-check-double-line', primary: true, fillRemaining: true },
        ]
      }
      return [
        { key: 'call', label: '电话联系', icon: 'ri-phone-line' },
        { key: 'continue', label: '继续巡检', icon: 'ri-play-circle-line', primary: true, fillRemaining: true },
      ]
    case 'completed':
      return [
        { key: 'call', label: '电话联系', icon: 'ri-phone-line' },
        { key: 'report', label: '查看报告', icon: 'ri-file-list-3-line', primary: true, fillRemaining: true },
      ]
    default:
      return [{ key: 'call', label: '电话联系', icon: 'ri-phone-line' }]
  }
})

const hasFillRemainingAction = computed(() => bottomActions.value.some((action) => action.fillRemaining))

function categoryStats(category: InspectionCategory) {
  const total = category.items.length
  const done = category.items.filter((item) => item.status !== 'unchecked').length
  return { total, done }
}

function categoryPanelHeight(category: InspectionCategory) {
  const count = category.items.length
  if (!count) return '0px'
  const dividerHeight = 1
  const rowHeight = 54
  return `${dividerHeight + count * rowHeight + (count - 1) * dividerHeight}px`
}

function buildingStats(building: Building) {
  const total = building.categories.reduce((sum, category) => sum + category.items.length, 0)
  const done = building.categories.reduce(
    (sum, category) => sum + category.items.filter((item) => item.status !== 'unchecked').length,
    0,
  )
  return { total, done }
}

function itemStatusLabel(status: CheckItem['status']) {
  if (status === 'normal') return '一切正常'
  if (status === 'focus') return '需重点关注'
  if (status === 'risk') return '存在风险'
  return '未检查'
}

function itemStatusClass(status: CheckItem['status']) {
  return {
    normal: status === 'normal',
    focus: status === 'focus',
    risk: status === 'risk',
  }
}

function itemStatusIcon(status: CheckItem['status']) {
  if (status === 'normal') return 'ri-checkbox-circle-fill'
  if (status === 'focus') return 'ri-error-warning-fill'
  if (status === 'risk') return 'ri-close-circle-fill'
  return ''
}

function itemStatusColor(status: CheckItem['status']) {
  if (status === 'normal') return 'item-status-text normal'
  if (status === 'focus') return 'item-status-text focus'
  if (status === 'risk') return 'item-status-text risk'
  return 'item-status-text'
}

function toggleCategory(category: InspectionCategory) {
  if (expandedCategoryIds.value.includes(category.id)) {
    expandedCategoryIds.value = expandedCategoryIds.value.filter((id) => id !== category.id)
    return
  }
  expandedCategoryIds.value = [...expandedCategoryIds.value, category.id]
}

function openEditor(item: CheckItem) {
  if (task.value?.status === 'completed') {
    reportVisible.value = true
    return
  }
  activeItem.value = item
  editorVisible.value = true
}

function saveInspection(payload: { status: CheckItem['status']; photos: string[]; description: string; impact: string }) {
  if (!activeItem.value) return
  activeItem.value.status = payload.status
  activeItem.value.photos = payload.photos
  activeItem.value.description = payload.description
  activeItem.value.impact = payload.impact
  editorVisible.value = false
}

function submitTask() {
  if (!task.value) return
  if (progressPercent.value < 100) {
    uni.showToast({ title: '请先完成全部巡检项', icon: 'none' })
    return
  }
  uni.showModal({
    title: '确认提交',
    content: '提交后该巡检任务将标记为已完成。',
    success: ({ confirm }) => {
      if (!confirm || !task.value) return
      task.value.status = 'completed'
      task.value.completedAt = new Date().toISOString().slice(0, 10)
      reportVisible.value = true
    },
  })
}

function continueInspection() {
  if (!firstUncheckedItem.value) {
    submitTask()
    return
  }
  openEditor(firstUncheckedItem.value)
}

function handleBottomAction(actionKey: BottomAction['key']) {
  if (!task.value) return
  switch (actionKey) {
    case 'start':
    case 'continue':
      continueInspection()
      return
    case 'navigate':
      openLocation({
        latitude: task.value.latitude,
        longitude: task.value.longitude,
        name: task.value.parkName,
        address: task.value.address,
      })
      return
    case 'call':
      makePhoneCall(task.value.phone)
      return
    case 'submit':
      submitTask()
      return
    case 'report':
      reportVisible.value = true
  }
}

function loadTask(id: number) {
  loading.value = true
  errorMessage.value = ''
  notFound.value = false
  fetchTaskDetail(id)
    .then((data) => {
      if (!data) {
        notFound.value = true
        return
      }
      task.value = data
      selectedBuildingIndex.value = 0
      expandedCategoryIds.value = []
    })
    .catch(() => {
      errorMessage.value = '任务详情加载失败，请稍后重试'
    })
    .finally(() => {
      loading.value = false
    })
}

watch(selectedBuildingIndex, () => {
  expandedCategoryIds.value = []
})

onLoad((query) => {
  taskId.value = Number(query?.id || 0)
  loadTask(taskId.value)
})

onPageScroll((event) => {
  if (event.scrollTop <= 4) {
    navScrolled.value = false
    return
  }
  if (event.scrollTop >= 24) {
    navScrolled.value = true
  }
})
</script>

<template>
  <view class="app-page" :class="{ 'theme-dark': isDark }">
    <view class="shell">
      <view class="page-nav" :class="{ 'page-nav--scrolled': navScrolled }" :style="navBarVars">
        <view class="page-nav__inner">
          <view class="page-nav__row">
            <view class="page-nav__side">
              <view class="page-nav__back" @tap="goBack('/pages/inspection/index')">
                <view class="page-nav__back-glyph" />
              </view>
            </view>
            <text class="page-nav__title">任务详情</text>
            <view class="page-nav__side page-nav__side--ghost" />
          </view>
        </view>
      </view>
      <view class="page-nav-spacer" :style="navBarVars" />
      <view class="page-scroll">
        <view v-if="loading" class="state-card">
          <AppIcon name="ri-loader-4-line" class="state-icon spinner" color="#5c5c5c" />
          <text class="text-muted">加载中…</text>
        </view>

        <view v-else-if="errorMessage" class="state-card">
          <AppIcon name="ri-error-warning-line" class="state-icon error" color="#e5484d" />
          <text class="text-muted">{{ errorMessage }}</text>
          <view class="btn btn-primary retry-btn" @tap="loadTask(taskId)">重试</view>
        </view>

        <view v-else-if="notFound" class="state-card">
          <AppIcon name="ri-file-search-line" class="state-icon" color="#5c5c5c" />
          <text class="text-muted">任务不存在或已被删除</text>
          <view class="btn btn-primary retry-btn" @tap="goInspectionHome()">返回工作台</view>
        </view>

        <template v-else-if="task">
          <view class="card detail-card">
            <view class="detail-top">
              <view class="detail-copy">
                <text class="detail-park">{{ task.parkName }}</text>
                <text class="detail-name">{{ task.taskName }}</text>
              </view>
              <view class="task-status-chip detail-status-chip">
                <AppIcon :name="statusIconName" :color="statusIconColor" />
                <text class="task-status-text">{{ statusLabel }}</text>
              </view>
            </view>

            <view class="detail-meta-list">
              <view class="detail-meta-row">
                <AppIcon name="ri-map-pin-line" class="detail-meta-icon" :color="isDark ? '#a3a3a3' : '#a3a3a3'" />
                <text class="detail-meta-text">{{ task.address }}</text>
              </view>
              <view class="detail-meta-row">
                <AppIcon name="ri-calendar-line" class="detail-meta-icon" :color="isDark ? '#a3a3a3' : '#a3a3a3'" />
                <text class="detail-meta-text">{{ deadlineDisplayText }}</text>
                <text v-if="timeRemainingLabel" class="detail-meta-tag">{{ timeRemainingLabel }}</text>
              </view>
            </view>

            <view class="progress-block">
              <view class="progress-head">
                <text class="progress-label">巡检进度</text>
                <text class="progress-text">{{ checkedItems }} / {{ totalItems }}</text>
              </view>
              <view class="progress-track">
                <view
                  class="progress-bar"
                  :class="{ complete: progressPercent === 100 }"
                  :style="{ width: `${progressPercent}%` }"
                />
              </view>
            </view>
          </view>

          <view class="segment-divider detail-divider" />

          <scroll-view scroll-x class="building-tabs" v-if="buildings.length > 1">
            <view class="building-row">
              <view
                v-for="(building, index) in buildings"
                :key="building.id"
                class="building-tab"
                :class="{ active: selectedBuildingIndex === index }"
                @tap="selectedBuildingIndex = index"
              >
                <text class="building-name">{{ building.name }}</text>
                <text class="building-meta">{{ buildingStats(building).done }}/{{ buildingStats(building).total }} 已检查</text>
              </view>
            </view>
          </scroll-view>

          <text class="section-title">{{ sectionTitle }}</text>

          <view v-for="category in currentBuilding?.categories" :key="category.id" class="card category-card">
            <view class="category-head" :class="{ expanded: expandedCategoryIds.includes(category.id) }" @tap="toggleCategory(category)">
              <view class="category-copy">
                <view class="category-main-line">
                  <text class="category-title">{{ category.name }}</text>
                  <text class="category-meta">{{ categoryStats(category).done }}/{{ categoryStats(category).total }} 已检查</text>
                </view>
                <text v-if="expandedCategoryIds.includes(category.id) && category.description" class="category-desc">{{ category.description }}</text>
              </view>
              <view class="category-side">
                <view class="category-arrow-wrap" :class="{ rotated: expandedCategoryIds.includes(category.id) }">
                  <view class="category-arrow-glyph" />
                </view>
              </view>
            </view>

            <view
              class="item-list"
              :class="{ expanded: expandedCategoryIds.includes(category.id) }"
              :style="{ maxHeight: expandedCategoryIds.includes(category.id) ? categoryPanelHeight(category) : '0px' }"
            >
              <view class="category-divider" />
              <view
                v-for="item in category.items"
                :key="item.id"
                class="item-row"
                @tap="openEditor(item)"
              >
                <view class="item-state-mark">
                  <view v-if="item.status === 'normal'" class="item-state-badge item-state-badge--normal">
                    <view class="item-state-check" />
                  </view>
                  <AppIcon
                    v-else-if="item.status !== 'unchecked'"
                    :name="itemStatusIcon(item.status)"
                    class="item-state-icon"
                    :class="itemStatusClass(item.status)"
                    :color="item.status === 'focus' ? '#fa7319' : '#e5484d'"
                  />
                  <view v-else class="item-state-ring" />
                </view>
                <view class="item-copy">
                  <text class="item-name">{{ item.name }}</text>
                </view>
                <text v-if="item.status !== 'unchecked'" :class="itemStatusColor(item.status)">{{ itemStatusLabel(item.status) }}</text>
                <AppIcon name="ri-arrow-right-s-line" class="item-arrow" :color="isDark ? '#a3a3a3' : '#a3a3a3'" />
              </view>
            </view>
          </view>
        </template>
      </view>

      <view v-if="task && !loading && !notFound && bottomActions.length" class="bottom-bar">
        <view class="bottom-actions">
          <view
            v-for="action in bottomActions"
            :key="action.key"
            class="detail-bottom-btn"
            :class="[
              action.primary ? 'detail-bottom-btn--primary' : 'detail-bottom-btn--secondary',
              action.fillRemaining || !hasFillRemainingAction ? 'detail-bottom-btn--fill' : 'detail-bottom-btn--compact',
            ]"
            @tap="handleBottomAction(action.key)"
          >
            <AppIcon
              :name="action.icon"
              class="detail-bottom-btn__icon"
              :color="action.primary ? (isDark ? '#171717' : '#ffffff') : (isDark ? '#a3a3a3' : '#5c5c5c')"
            />
            <text class="detail-bottom-btn__text">{{ action.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <InspectionEditorSheet
      :visible="editorVisible"
      :item="activeItem"
      @close="editorVisible = false"
      @save="saveInspection"
    />
    <TaskReportSheet :visible="reportVisible" :task="task" @close="reportVisible = false" />
  </view>
</template>

<style scoped>
.page-scroll {
  flex: 1;
  padding: 0 32rpx calc(env(safe-area-inset-bottom, 0px) + 88px);
  box-sizing: border-box;
}

.state-card {
  min-height: 480rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.detail-card {
  padding: 24rpx;
  margin-top: 16rpx;
}

.category-card {
  margin-top: 16rpx;
  padding: 0;
  overflow: hidden;
}

.detail-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.detail-copy {
  flex: 1;
  min-width: 0;
}

.detail-park {
  display: block;
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  color: var(--text-primary);
}

.detail-name {
  display: block;
  font-size: 13px;
  line-height: 20px;
  color: var(--text-secondary);
}

.detail-status-chip {
  margin-top: 2rpx;
}

.detail-meta-list {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.detail-meta-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.detail-meta-icon {
  width: 36rpx;
  height: 36rpx;
  flex: none;
}

.detail-meta-text {
  min-width: 0;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: var(--text-secondary);
}

.detail-meta-tag {
  display: inline-flex;
  margin-left: 8rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  background: var(--bg-chip);
  color: var(--text-secondary);
  font-size: 20rpx;
  line-height: 28rpx;
  font-weight: 500;
}

.progress-block {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.progress-label {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: var(--text-primary);
}

.progress-track {
  width: 100%;
  height: 12rpx;
  border-radius: 999rpx;
  background: var(--border-subtle);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: var(--text-primary);
}

.theme-dark .progress-bar {
  background: #e5e5e5;
}

.progress-bar.complete {
  background: var(--status-success);
}

.progress-text {
  font-size: 12px;
  line-height: 16px;
  color: var(--text-secondary);
}

.building-tabs {
  margin-top: 0;
}

.building-row {
  display: flex;
  gap: 10rpx;
}

.building-tab {
  min-width: 188rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  background: var(--bg-soft);
}

.building-tab.active {
  background: var(--text-primary);
  color: var(--bg-card);
}

.building-name {
  display: block;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: inherit;
}

.building-meta {
  display: block;
  margin-top: 4rpx;
  font-size: 12px;
  line-height: 16px;
  opacity: 0.8;
  color: inherit;
}

.section-title {
  display: block;
  margin-top: 24rpx;
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.category-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 0 24rpx;
  min-height: 56px;
}

.category-head.expanded {
  align-items: flex-start;
  padding-top: 16px;
  padding-bottom: 16px;
}

.category-copy {
  flex: 1;
  min-width: 0;
}

.category-main-line {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.category-title {
  display: block;
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  color: var(--text-primary);
  flex: none;
}

.category-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 13px;
  line-height: 20px;
  color: var(--text-secondary);
}

.category-side {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: none;
  color: var(--text-tertiary);
}

.category-meta {
  font-size: 13px;
  line-height: 20px;
  color: var(--text-secondary);
  min-width: 0;
  white-space: nowrap;
}

.category-arrow-wrap {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 300ms ease-out;
  transform: rotate(0deg);
  transform-origin: center center;
}

.category-arrow-glyph {
  width: 10px;
  height: 10px;
  border-right: 2px solid var(--text-tertiary);
  border-bottom: 2px solid var(--text-tertiary);
  box-sizing: border-box;
  transform: rotate(45deg) translateY(-1px);
  transform-origin: center center;
}

.category-arrow-wrap.rotated {
  transform: rotate(180deg);
}

.item-list {
  margin-top: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-height 280ms cubic-bezier(0.25, 0.1, 0.25, 1),
    opacity 200ms ease 40ms;
  pointer-events: none;
}

.item-list.expanded {
  opacity: 1;
  pointer-events: auto;
}

.category-divider {
  height: 1px;
  margin: 0 24rpx;
  background: var(--border-subtle);
}

.item-row {
  height: 54px;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-row + .item-row {
  position: relative;
}

.item-row + .item-row::before {
  content: '';
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  top: 0;
  height: 1px;
  background-image: repeating-linear-gradient(
    to right,
    rgba(23, 23, 23, 0.1) 0,
    rgba(23, 23, 23, 0.1) 4px,
    transparent 4px,
    transparent 8px
  );
}

.theme-dark .item-row + .item-row::before {
  background-image: repeating-linear-gradient(
    to right,
    rgba(255, 255, 255, 0.12) 0,
    rgba(255, 255, 255, 0.12) 4px,
    transparent 4px,
    transparent 8px
  );
}

.item-state-mark {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.item-state-badge {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.item-state-badge--normal {
  background: var(--status-success);
}

.item-state-check {
  width: 9px;
  height: 5px;
  border-left: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  box-sizing: border-box;
  transform: rotate(-45deg) translateY(-0.5px);
}

.item-state-icon {
  width: 20px;
  height: 20px;
}

.item-state-ring {
  width: 18px;
  height: 18px;
  border-radius: 999rpx;
  border: 2px solid var(--border-strong);
  box-sizing: border-box;
}

.item-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  min-height: 20px;
}

.item-name {
  display: block;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
  transform: translateY(-0.5px);
}

.item-status-text {
  flex: none;
  font-size: 13px;
  line-height: 20px;
  color: var(--text-secondary);
  transform: translateY(-0.5px);
}

.item-status-text.normal {
  color: var(--status-success);
}

.item-status-text.focus {
  color: var(--status-warning);
}

.item-status-text.risk {
  color: var(--status-danger);
}

.item-arrow {
  font-size: 20px;
  margin-left: 4px;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-card);
  border-top: 1px solid rgba(23, 23, 23, 0.08);
}

.theme-dark .bottom-bar {
  background: var(--bg-card);
  border-top-color: rgba(255, 255, 255, 0.1);
}

.bottom-actions {
  max-width: 430px;
  margin: 0 auto;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
  display: flex;
  gap: 8px;
}

.detail-bottom-btn {
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
}

.detail-bottom-btn--compact {
  flex: none;
  min-width: 112px;
  padding: 0 14px;
}

.detail-bottom-btn--fill {
  min-width: 0;
  flex: 1;
  padding: 0 16px;
}

.detail-bottom-btn--primary {
  background: var(--text-primary);
  color: var(--bg-card);
}

.theme-dark .detail-bottom-btn--primary {
  background: #e5e5e5;
  color: #171717;
}

.detail-bottom-btn--secondary {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-secondary);
}

.theme-dark .detail-bottom-btn--secondary {
  background: rgba(255, 255, 255, 0.1);
}

.detail-bottom-btn__icon {
  width: 18px;
  height: 18px;
  flex: none;
}

.detail-bottom-btn__text {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
}

.state-icon {
  font-size: 56rpx;
  color: var(--text-quaternary);
}

.state-icon.error {
  color: #e5484d;
}

.retry-btn {
  width: 200rpx;
}

.detail-divider {
  margin: 16px 0;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
