<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPageScroll } from '@dcloudio/uni-app'
import AppIcon from '@/components/common/app-icon.vue'
import MaintenanceExecutionSheet from '@/components/maintenance/MaintenanceExecutionSheet.vue'
import MaintenanceResultSheet from '@/components/maintenance/MaintenanceResultSheet.vue'
import { fetchMaintenanceTaskDetail } from '@/shared/api/maintenance'
import type { MaintenanceTaskDetail } from '@/shared/types/maintenance'
import { daysFromToday, parseTaskDate } from '@/shared/utils/date'
import { makePhoneCall, openLocation } from '@/services/platform/device'
import { usePageNavVars } from '@/services/platform/layout'
import { goBack, goMaintenanceHome } from '@/services/platform/navigation'
import { useTheme } from '@/services/platform/theme'
import { previewImages } from '@/services/platform/media'

const taskId = ref(0)
const task = ref<MaintenanceTaskDetail | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const notFound = ref(false)
const beforeMedia = ref<string[]>([])
const afterMedia = ref<string[]>([])
const executionNote = ref('')
const executionVisible = ref(false)
const executionMode = ref<'before' | 'after'>('before')
const resultVisible = ref(false)
const resultConfirmable = ref(false)
const navScrolled = ref(false)
const navBarVars = usePageNavVars()
const { isDark } = useTheme()

type BottomAction = {
  key: 'call' | 'navigate' | 'start' | 'report' | 'summary'
  label: string
  icon: string
  primary?: boolean
  fillRemaining?: boolean
}

const statusLabel = computed(() => {
  if (!task.value) return ''
  if (task.value.status === 'active') return '处理中'
  if (task.value.status === 'pending') return '待接单'
  return '已完成'
})

const statusIconName = computed(() => {
  if (!task.value) return 'ri-time-line'
  if (task.value.status === 'active') return 'ri-loader-2-line'
  if (task.value.status === 'pending') return 'ri-time-line'
  return 'ri-checkbox-circle-fill'
})

const statusIconColor = computed(() => {
  if (!task.value) return isDark.value ? '#e5e5e5' : '#171717'
  if (task.value.status === 'pending') return '#fa7319'
  if (task.value.status === 'completed') return '#1fc16b'
  return isDark.value ? '#e5e5e5' : '#171717'
})

const detailTimeText = computed(() => {
  if (!task.value) return ''
  if (task.value.status === 'completed' && task.value.completedAt) return `${task.value.completedAt} 完成维修`
  if (task.value.status === 'pending' && task.value.plannedAt) return `计划开始 ${task.value.plannedAt}`
  return task.value.deadline || ''
})

const timeRemainingLabel = computed(() => {
  if (!task.value || task.value.status === 'completed') return ''
  if (task.value.status === 'pending') {
    const diffDays = daysFromToday(parseTaskDate(task.value.plannedAt || ''))
    if (diffDays == null) return ''
    if (diffDays < 0) return '已可开始'
    if (diffDays === 0) return '今天开始'
    return `还有${diffDays}天开始`
  }
  const diffDays = daysFromToday(parseTaskDate(task.value.deadline || ''))
  if (diffDays == null) return ''
  if (diffDays < 0) return '已逾期'
  if (diffDays === 0) return '今天到期'
  return `还剩${diffDays}天`
})

const sourceInstructionText = computed(() => {
  if (!task.value) return ''
  return [task.value.dispatchReason, task.value.sourceFinding, task.value.sourceRemark].filter(Boolean).join('；')
})

const bottomActions = computed<BottomAction[]>(() => {
  if (!task.value) return []
  switch (task.value.status) {
    case 'pending':
      return [
        { key: 'start', label: '提交开工记录', icon: 'ri-play-circle-line', primary: true, fillRemaining: true },
        { key: 'navigate', label: '导航过去', icon: 'ri-map-pin-line' },
        { key: 'call', label: '电话联系', icon: 'ri-phone-line' },
      ]
    case 'active':
      return [
        { key: 'call', label: '电话联系', icon: 'ri-phone-line' },
        { key: 'report', label: '提交维修结果', icon: 'ri-file-list-3-line', primary: true, fillRemaining: true },
      ]
    case 'completed':
      return [
        { key: 'call', label: '电话联系', icon: 'ri-phone-line' },
        { key: 'summary', label: '查看维修报告', icon: 'ri-file-list-3-line', primary: true, fillRemaining: true },
      ]
    default:
      return []
  }
})

const hasFillRemainingAction = computed(() => bottomActions.value.some((action) => action.fillRemaining))

function loadTask(id: number) {
  loading.value = true
  errorMessage.value = ''
  notFound.value = false
  fetchMaintenanceTaskDetail(id)
    .then((data) => {
      if (!data) {
        notFound.value = true
        return
      }
      task.value = data
      beforeMedia.value = data.beforeMedia ? [...data.beforeMedia] : []
      afterMedia.value = data.afterMedia ? [...data.afterMedia] : []
      executionNote.value = data.executionNote ?? ''
      resultConfirmable.value = false
    })
    .catch(() => {
      errorMessage.value = '维修任务加载失败，请稍后重试'
    })
    .finally(() => {
      loading.value = false
    })
}

function handleSaveExecution(payload: { beforeMedia: string[]; afterMedia: string[]; executionNote: string }) {
  if (!task.value) return
  if (executionMode.value === 'before') {
    beforeMedia.value = payload.beforeMedia
    task.value.beforeMedia = payload.beforeMedia
    task.value.status = 'active'
    task.value.steps.forEach((step, index) => {
      step.status = index === 0 ? 'done' : index === 1 ? 'active' : 'pending'
    })
    executionVisible.value = false
    return
  }
  afterMedia.value = payload.afterMedia
  executionNote.value = payload.executionNote
  task.value.afterMedia = payload.afterMedia
  task.value.executionNote = payload.executionNote
  executionVisible.value = false
  resultConfirmable.value = true
  resultVisible.value = true
}

function confirmReport() {
  if (!task.value) return
  task.value.status = 'completed'
  task.value.completedAt = new Date().toISOString().slice(0, 10)
  task.value.steps.forEach((step) => {
    step.status = 'done'
  })
  task.value.completionSummary =
    task.value.completionSummary ||
    `${task.value.taskName} 已完成维修处理，现场复测结果正常。`
  resultConfirmable.value = false
  resultVisible.value = false
}

function openStartSheet() {
  executionMode.value = 'before'
  executionVisible.value = true
}

function openResultSheet() {
  executionMode.value = 'after'
  executionVisible.value = true
}

function handleBottomAction(action: BottomAction['key']) {
  if (!task.value) return
  switch (action) {
    case 'call':
      makePhoneCall(task.value.phone)
      return
    case 'navigate':
      openLocation({
        latitude: task.value.latitude,
        longitude: task.value.longitude,
        name: task.value.parkName,
        address: task.value.address,
      })
      return
    case 'start':
      openStartSheet()
      return
    case 'report':
      openResultSheet()
      return
    case 'summary':
      resultVisible.value = true
  }
}

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
              <view class="page-nav__back" @tap="goBack('/pages/maintenance/index')">
                <view class="page-nav__back-glyph" />
              </view>
            </view>
            <text class="page-nav__title">维修任务详情</text>
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
          <text class="text-muted">维修任务不存在或已被删除</text>
          <view class="btn btn-primary retry-btn" @tap="goMaintenanceHome()">返回工作台</view>
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
                <text class="detail-meta-text">{{ task.buildingName }} · {{ task.location }}</text>
              </view>
              <view v-if="task.address" class="detail-meta-row">
                <AppIcon name="ri-road-map-line" class="detail-meta-icon" :color="isDark ? '#a3a3a3' : '#a3a3a3'" />
                <text class="detail-meta-text">{{ task.address }}</text>
              </view>
              <view class="detail-meta-row">
                <AppIcon name="ri-calendar-line" class="detail-meta-icon" :color="isDark ? '#a3a3a3' : '#a3a3a3'" />
                <text class="detail-meta-text">{{ detailTimeText }}</text>
                <text v-if="timeRemainingLabel" class="detail-meta-tag">{{ timeRemainingLabel }}</text>
              </view>
            </view>
          </view>

          <view class="segment-divider detail-divider" />

          <view class="card section-card source-card">
            <text class="section-title">来源巡检问题</text>
            <view class="source-meta-list">
              <view class="source-meta-row">
                <AppIcon name="ri-file-list-3-line" class="source-meta-icon" :color="isDark ? '#a3a3a3' : '#a3a3a3'" />
                <text class="source-meta-text">{{ task.sourceInspectionTask }}</text>
              </view>
              <view class="source-meta-row">
                <AppIcon name="ri-alert-line" class="source-meta-icon source-meta-icon--alert" color="#fa7319" />
                <text class="source-meta-text">{{ task.issueCategory }} · {{ task.riskLevelLabel }}</text>
              </view>
            </view>

            <view class="source-highlight-card">
              <view class="source-highlight-head">
                <text class="source-highlight-title">{{ task.sourceInspectionItem }}</text>
                <text class="source-highlight-tag">{{ task.sourceStatusLabel }}</text>
              </view>
              <text v-if="sourceInstructionText" class="source-highlight-copy">{{ sourceInstructionText }}</text>
            </view>

            <view class="source-block">
              <text class="subheading">问题描述</text>
              <view class="info-panel">
                <text class="info-panel-text">{{ task.sourceDescription }}</text>
              </view>
            </view>

            <view class="source-block">
              <text class="subheading">影响评估</text>
              <view class="info-panel">
                <text class="info-panel-text">{{ task.sourceImpact }}</text>
              </view>
            </view>

            <view v-if="task.sourcePhotos?.length" class="source-photo-grid">
              <image
                v-for="photo in task.sourcePhotos"
                :key="photo"
                class="source-photo"
                :src="photo"
                mode="aspectFill"
                @tap="previewImages(task.sourcePhotos || [], photo)"
              />
            </view>
          </view>

          <view class="card section-card">
            <text class="section-title">维修处理信息</text>
            <view class="info-grid">
              <view class="info-grid-card">
                <text class="info-grid-label">工单编号</text>
                <text class="info-grid-value">{{ task.workOrderNo }}</text>
              </view>
              <view class="info-grid-card">
                <text class="info-grid-label">现场联系人</text>
                <text class="info-grid-value">{{ task.contact || '-' }}</text>
              </view>
            </view>

            <view class="material-block">
              <text class="material-title">工具与材料</text>
              <view class="material-chip-list">
                <text
                  v-for="item in [...task.requiredTools, ...task.requiredMaterials]"
                  :key="item"
                  class="material-chip"
                >
                  {{ item }}
                </text>
              </view>
            </view>

            <view class="safety-block">
              <text class="material-title">安全提醒</text>
              <view class="safety-list">
                <view v-for="note in task.safetyNotes" :key="note" class="safety-card">
                  <AppIcon name="ri-shield-check-line" class="safety-icon" color="#fa7319" />
                  <text class="safety-text">{{ note }}</text>
                </view>
              </view>
            </view>
          </view>

        </template>
      </view>

      <view v-if="task && !loading && !notFound && bottomActions.length" class="bottom-bar safe-bottom">
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

    <MaintenanceExecutionSheet
      :visible="executionVisible"
      :mode="executionMode"
      :before-media="beforeMedia"
      :after-media="afterMedia"
      :execution-note="executionNote"
      @close="executionVisible = false"
      @save="handleSaveExecution"
    />
    <MaintenanceResultSheet
      :visible="resultVisible"
      :before-media="beforeMedia"
      :after-media="afterMedia"
      :execution-note="executionNote"
      :completion-summary="task?.completionSummary"
      :confirmable="resultConfirmable"
      @close="resultVisible = false"
      @confirm="confirmReport"
    />
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

.detail-card,
.section-card {
  padding: 24rpx;
  margin-top: 16rpx;
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
  margin-top: 2rpx;
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
  display: block;
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

.detail-divider {
  margin-top: 16rpx;
}

.section-title {
  display: block;
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.source-meta-list {
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.source-meta-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.source-meta-icon {
  width: 32rpx;
  height: 32rpx;
  flex: none;
}

.source-meta-icon--alert {
  transform: scale(1.08) translateY(-0.5px);
}

.source-meta-text {
  font-size: 14px;
  line-height: 20px;
  color: var(--text-secondary);
}

.source-highlight-card {
  margin-top: 16rpx;
  border-radius: 24rpx;
  background: var(--bg-soft);
  padding: 24rpx;
}

.source-highlight-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.source-highlight-title {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: var(--text-primary);
}

.source-highlight-tag {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: var(--bg-card);
  font-size: 11px;
  line-height: 16px;
  color: var(--text-secondary);
}

.source-highlight-copy {
  display: block;
  margin-top: 8rpx;
  font-size: 13px;
  line-height: 20px;
  color: var(--text-tertiary);
}

.source-block,
.material-block,
.safety-block {
  margin-top: 16rpx;
}

.subheading,
.material-title {
  display: block;
  margin-bottom: 6rpx;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  color: var(--text-secondary);
}

.info-panel {
  border-radius: 24rpx;
  background: var(--bg-soft);
  padding: 24rpx;
}

.info-panel-text {
  font-size: 14px;
  line-height: 22px;
  color: var(--text-primary);
}

.source-photo-grid {
  margin-top: 12rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.source-photo {
  width: 100%;
  height: 240rpx;
  border-radius: 24rpx;
  background: var(--bg-softer);
}

.info-grid {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.info-grid-card {
  border-radius: 24rpx;
  background: var(--bg-soft);
  padding: 24rpx;
}

.info-grid-label {
  display: block;
  font-size: 12px;
  line-height: 16px;
  color: var(--text-tertiary);
}

.info-grid-value {
  display: block;
  margin-top: 4rpx;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  color: var(--text-primary);
}

.material-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.material-chip {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: var(--bg-soft);
  font-size: 12px;
  line-height: 16px;
  color: var(--text-secondary);
}

.safety-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.safety-card {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  border-radius: 24rpx;
  background: #fff7e6;
  padding: 24rpx;
}

.theme-dark .safety-card {
  background: #3d2b1f;
}

.safety-icon {
  width: 32rpx;
  height: 32rpx;
  margin-top: 2rpx;
  flex: none;
}

.safety-text {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--text-secondary);
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-card);
  border-top: 1px solid var(--border-subtle);
}

.bottom-actions {
  max-width: 430px;
  margin: 0 auto;
  padding: 16rpx 32rpx 0;
  display: flex;
  gap: 8rpx;
}

.detail-bottom-btn {
  height: 40px;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  white-space: nowrap;
  box-sizing: border-box;
}

.detail-bottom-btn--secondary {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-secondary);
}

.theme-dark .detail-bottom-btn--secondary {
  background: rgba(255, 255, 255, 0.1);
}

.detail-bottom-btn--primary {
  background: var(--text-primary);
  color: var(--bg-card);
}

.detail-bottom-btn--compact {
  flex: none;
  padding: 0 16rpx;
}

.detail-bottom-btn--fill {
  flex: 1;
  min-width: 0;
}

.detail-bottom-btn__icon {
  width: 36rpx;
  height: 36rpx;
  display: block;
  transform: translateY(-2px);
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

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
