<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import MaintenanceExecutionSheet from '@/components/maintenance/MaintenanceExecutionSheet.vue'
import MaintenanceResultSheet from '@/components/maintenance/MaintenanceResultSheet.vue'
import { fetchMaintenanceTaskDetail } from '@/shared/api/maintenance'
import type { MaintenanceStep, MaintenanceTaskDetail } from '@/shared/types/maintenance'
import { daysFromToday, parseTaskDate } from '@/shared/utils/date'
import { makePhoneCall, openLocation } from '@/services/platform/device'
import { goMaintenanceHome } from '@/services/platform/navigation'
import { useTheme } from '@/services/platform/theme'

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
const { isDark } = useTheme()

const statusLabel = computed(() => {
  if (!task.value) return ''
  if (task.value.status === 'active') return '处理中'
  if (task.value.status === 'pending') return '待接单'
  return '已完成'
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

function stepStatusLabel(step: MaintenanceStep) {
  if (step.status === 'done') return '已完成'
  if (step.status === 'active') return '处理中'
  return '待执行'
}

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

onLoad((query) => {
  taskId.value = Number(query?.id || 0)
  loadTask(taskId.value)
})
</script>

<template>
  <view class="app-page" :class="{ 'theme-dark': isDark }">
    <view class="shell safe-top">
      <scroll-view scroll-y class="page-scroll">
        <view v-if="loading" class="state-card">
          <text class="app-icon ri-loader-4-line state-icon spinner" />
          <text class="text-muted">加载中…</text>
        </view>

        <view v-else-if="errorMessage" class="state-card">
          <text class="app-icon ri-error-warning-line state-icon error" />
          <text class="text-muted">{{ errorMessage }}</text>
          <view class="btn btn-primary retry-btn" @tap="loadTask(taskId)">重试</view>
        </view>

        <view v-else-if="notFound" class="state-card">
          <text class="app-icon ri-file-search-line state-icon" />
          <text class="text-muted">维修任务不存在或已被删除</text>
          <view class="btn btn-primary retry-btn" @tap="goMaintenanceHome()">返回工作台</view>
        </view>

        <template v-else-if="task">
          <view class="card detail-card">
            <view class="head-row">
              <text class="chip">{{ statusLabel }}</text>
              <text v-if="timeRemainingLabel" class="meta-tag">{{ timeRemainingLabel }}</text>
            </view>
            <text class="title">{{ task.taskName }}</text>
            <text class="subtitle">{{ task.parkName }} · {{ task.buildingName }}</text>
            <text class="meta">{{ detailTimeText }}</text>
            <text class="task-copy">{{ task.location }}</text>
          </view>

          <view class="card section-card">
            <text class="section-title">维修工单信息</text>
            <view class="kv-row"><text class="kv-label">工单号</text><text class="kv-value">{{ task.workOrderNo }}</text></view>
            <view class="kv-row"><text class="kv-label">问题分类</text><text class="kv-value">{{ task.issueCategory }}</text></view>
            <view class="kv-row"><text class="kv-label">风险等级</text><text class="kv-value">{{ task.riskLevelLabel }}</text></view>
            <view class="kv-row"><text class="kv-label">地址</text><text class="kv-value">{{ task.address }}</text></view>
            <view class="kv-row"><text class="kv-label">联系人</text><text class="kv-value">{{ task.contact }}</text></view>
          </view>

          <view class="card section-card">
            <text class="section-title">派单原因</text>
            <text class="section-copy">{{ task.dispatchReason }}</text>
            <text class="subheading">检修来源</text>
            <text class="section-copy">{{ task.sourceInspectionItem }} · {{ task.sourceStatusLabel }}</text>
            <text class="section-copy">{{ task.sourceDescription }}</text>
            <text class="section-copy">影响：{{ task.sourceImpact }}</text>
            <text v-if="task.sourceRemark" class="section-copy">备注：{{ task.sourceRemark }}</text>
          </view>

          <view class="card section-card">
            <text class="section-title">执行步骤</text>
            <view v-for="step in task.steps" :key="step.id" class="step-row">
              <view class="step-dot" :class="step.status" />
              <view class="step-copy">
                <text class="step-title">{{ step.title }}</text>
                <text class="step-desc">{{ step.description }}</text>
              </view>
              <text class="step-status">{{ stepStatusLabel(step) }}</text>
            </view>
          </view>

          <view class="card section-card">
            <text class="section-title">物料与安全</text>
            <text class="subheading">工具</text>
            <text class="section-copy">{{ task.requiredTools.join(' / ') }}</text>
            <text class="subheading">材料</text>
            <text class="section-copy">{{ task.requiredMaterials.join(' / ') }}</text>
            <text class="subheading">安全注意</text>
            <text v-for="note in task.safetyNotes" :key="note" class="section-copy">- {{ note }}</text>
          </view>
        </template>
      </scroll-view>

      <view v-if="task && !loading && !notFound" class="bottom-bar safe-bottom">
        <view class="bottom-actions">
          <view class="btn btn-secondary compact-btn" @tap="makePhoneCall(task.phone)">电话联系</view>
          <view class="btn btn-secondary compact-btn" @tap="openLocation({ latitude: task.latitude, longitude: task.longitude, name: task.parkName, address: task.address })">
            导航过去
          </view>
          <view
            class="btn btn-primary main-btn"
            @tap="task.status === 'pending' ? openStartSheet() : task.status === 'active' ? openResultSheet() : (resultVisible = true)"
          >
            {{ task.status === 'pending' ? '提交开工记录' : task.status === 'active' ? '提交维修结果' : '查看维修报告' }}
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
.section-card {
  padding: 24rpx;
  margin-top: 16rpx;
}

.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.title {
  display: block;
  margin-top: 16rpx;
  font-size: 36rpx;
  line-height: 52rpx;
  font-weight: 700;
}

.subtitle,
.meta,
.task-copy {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: #5c5c5c;
}

.meta-tag {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: #eef6ff;
  color: #006adc;
  font-size: 22rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}

.kv-row {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  padding: 18rpx 0;
}

.kv-row + .kv-row {
  border-top: 1px solid #ebebeb;
}

.kv-label {
  width: 140rpx;
  font-size: 24rpx;
  color: #737373;
}

.kv-value {
  flex: 1;
  font-size: 26rpx;
  line-height: 38rpx;
  text-align: right;
}

.section-copy {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  line-height: 38rpx;
}

.subheading {
  display: block;
  margin-top: 18rpx;
  font-size: 24rpx;
  color: #737373;
}

.step-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 18rpx 0;
}

.step-row + .step-row {
  border-top: 1px solid #ebebeb;
}

.step-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 999rpx;
  background: #d4d4d4;
  margin-top: 10rpx;
}

.step-dot.done {
  background: #1fc16b;
}

.step-dot.active {
  background: #171717;
}

.step-copy {
  flex: 1;
}

.step-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
}

.step-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  line-height: 34rpx;
  color: #5c5c5c;
}

.step-status {
  font-size: 22rpx;
  color: #737373;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(235, 235, 235, 0.95);
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
  color: #a3a3a3;
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
