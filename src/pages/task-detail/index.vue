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

const statusLabel = computed(() => {
  if (!task.value) return ''
  if (task.value.status === 'active') return '进行中'
  if (task.value.status === 'pending') return '待完成'
  return '已完成'
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

function categoryStats(category: InspectionCategory) {
  const total = category.items.length
  const done = category.items.filter((item) => item.status !== 'unchecked').length
  return { total, done }
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
            <view class="head-row">
              <text class="chip">{{ statusLabel }}</text>
              <text v-if="timeRemainingLabel" class="meta-tag">{{ timeRemainingLabel }}</text>
            </view>
            <text class="title">{{ task.taskName }}</text>
            <text class="subtitle">{{ task.parkName }}</text>
            <text class="meta">{{ deadlineDisplayText }}</text>

            <view class="progress-row">
              <view class="progress-track">
                <view class="progress-bar" :style="{ width: `${progressPercent}%` }" />
              </view>
              <text class="progress-text">{{ checkedItems }}/{{ totalItems }}</text>
            </view>

            <view class="info-grid">
              <view class="info-item">
                <text class="info-label">联系人</text>
                <text class="info-value">{{ task.contact || task.inspector }}</text>
              </view>
              <view class="info-item">
                <text class="info-label">地址</text>
                <text class="info-value">{{ task.address }}</text>
              </view>
            </view>
          </view>

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
                <text class="building-meta">{{ buildingStats(building).done }}/{{ buildingStats(building).total }}</text>
              </view>
            </view>
          </scroll-view>

          <view v-for="category in currentBuilding?.categories" :key="category.id" class="card category-card">
            <view class="category-head" @tap="toggleCategory(category)">
              <view class="category-copy">
                <text class="category-title">{{ category.name }}</text>
                <text class="category-desc">{{ category.description }}</text>
              </view>
              <view class="category-side">
                <text class="category-meta">{{ categoryStats(category).done }}/{{ categoryStats(category).total }}</text>
                  <AppIcon
                    name="ri-arrow-down-s-line"
                    :color="isDark ? '#a3a3a3' : '#5c5c5c'"
                    :class="{ rotated: expandedCategoryIds.includes(category.id) }"
                  />
              </view>
            </view>

            <view v-if="expandedCategoryIds.includes(category.id)" class="item-list">
              <view
                v-for="item in category.items"
                :key="item.id"
                class="item-row"
                @tap="openEditor(item)"
              >
                <view class="item-copy">
                  <text class="item-name">{{ item.name }}</text>
                  <text class="item-status" :class="itemStatusClass(item.status)">{{ itemStatusLabel(item.status) }}</text>
                </view>
                <AppIcon name="ri-arrow-right-s-line" class="item-arrow" :color="isDark ? '#a3a3a3' : '#a3a3a3'" />
              </view>
            </view>
          </view>
        </template>
      </view>

      <view v-if="task && !loading && !notFound" class="bottom-bar safe-bottom">
        <view class="bottom-actions">
          <view class="btn btn-secondary compact-btn" @tap="makePhoneCall(task.phone)">电话联系</view>
          <view class="btn btn-secondary compact-btn" @tap="openLocation({ latitude: task.latitude, longitude: task.longitude, name: task.parkName, address: task.address })">
            导航过去
          </view>
          <view
            class="btn btn-primary main-btn"
            @tap="task.status === 'completed' ? (reportVisible = true) : progressPercent === 100 ? submitTask() : continueInspection()"
          >
            {{ task.status === 'completed' ? '查看报告' : progressPercent === 100 ? '提交' : '继续巡检' }}
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
  padding: 0 32rpx 180rpx;
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

.detail-card,
.category-card {
  padding: 24rpx;
  margin-top: 16rpx;
}

.head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.title {
  display: block;
  margin-top: 16rpx;
  font-size: 36rpx;
  line-height: 52rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.subtitle,
.meta {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: var(--text-secondary);
}

.meta-tag {
  display: inline-flex;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: var(--bg-chip-info);
  color: var(--brand-blue);
  font-size: 22rpx;
}

.progress-row {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-track {
  flex: 1;
  height: 14rpx;
  border-radius: 999rpx;
  background: var(--border-subtle);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: var(--text-primary);
}

.progress-text {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.info-grid {
  margin-top: 24rpx;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16rpx;
}

.info-label {
  display: block;
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.info-value {
  display: block;
  margin-top: 6rpx;
  font-size: 26rpx;
  line-height: 38rpx;
  color: var(--text-primary);
}

.building-tabs {
  margin-top: 20rpx;
}

.building-row {
  display: flex;
  gap: 12rpx;
}

.building-tab {
  min-width: 200rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: var(--bg-soft);
}

.building-tab.active {
  background: var(--text-primary);
  color: var(--bg-card);
}

.building-name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: inherit;
}

.building-meta {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  opacity: 0.8;
  color: inherit;
}

.category-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.category-copy {
  flex: 1;
}

.category-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.category-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  color: var(--text-tertiary);
}

.category-side {
  display: flex;
  align-items: center;
  gap: 10rpx;
  color: var(--text-tertiary);
}

.category-meta {
  font-size: 22rpx;
}

.rotated {
  transform: rotate(180deg);
}

.item-list {
  margin-top: 18rpx;
}

.item-row {
  padding: 18rpx 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.item-row + .item-row {
  border-top: 1px solid var(--border-subtle);
}

.item-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.item-name {
  display: block;
  font-size: 26rpx;
  line-height: 38rpx;
  color: var(--text-primary);
}

.item-status {
  display: inline-flex;
  align-self: flex-start;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  line-height: 30rpx;
  background: var(--bg-chip);
  color: var(--text-secondary);
}

.item-status.normal {
  background: var(--status-success-soft);
  color: var(--status-success);
}

.item-status.focus {
  background: var(--status-warning-soft);
  color: var(--status-warning);
}

.item-status.risk {
  background: var(--status-danger-soft);
  color: var(--status-danger);
}

.item-arrow {
  font-size: 28rpx;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-page);
  border-top: 1px solid var(--border-subtle);
}

.bottom-actions {
  max-width: 430px;
  margin: 0 auto;
  padding: 16rpx 32rpx 0;
  display: flex;
  gap: 12rpx;
}

.compact-btn {
  min-width: 160rpx;
}

.main-btn {
  flex: 1;
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

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
