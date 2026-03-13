<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppIcon from '@/components/common/app-icon.vue'
import BaseSheet from '@/components/common/BaseSheet.vue'
import UserCardMenu from '@/components/common/UserCardMenu.vue'
import { clearSession, getStoredSession } from '@/shared/auth/session'
import { fetchMaintenanceTaskList } from '@/shared/api/maintenance'
import type { MaintenanceTask, MaintenanceTaskSection } from '@/shared/types/maintenance'
import { goLogin, goMaintenanceDetail } from '@/services/platform/navigation'
import { useTopSafeAreaVars } from '@/services/platform/layout'
import { useTheme } from '@/services/platform/theme'

const sections = ref<MaintenanceTaskSection[]>([])
const loading = ref(true)
const errorMessage = ref('')
const selectedPark = ref<string | null>(null)
const showFilterSheet = ref(false)
const showPlannedSheet = ref(false)
const currentUserName = ref('李电工')
const currentUserAvatar = ref('/static/avatar-maintainer-default.png')
const currentTradeLabel = ref('电工')
const currentTrade = ref<'electric' | 'plumbing'>('electric')
const { isDark } = useTheme()
const safeAreaVars = useTopSafeAreaVars()

const activeSection = computed(() => sections.value.find((section) => section.key === 'active'))
const pendingSection = computed(() => sections.value.find((section) => section.key === 'pending'))
const completedSection = computed(() => sections.value.find((section) => section.key === 'completed'))
const completedCount = computed(() => completedSection.value?.tasks.length ?? 0)
const parkNames = computed(() => [...new Set((completedSection.value?.tasks ?? []).map((task) => task.parkName))])
const plannedTasks = computed(() => [...(activeSection.value?.tasks ?? []), ...(pendingSection.value?.tasks ?? [])])
const filteredCompletedTasks = computed(() => {
  const tasks = completedSection.value?.tasks ?? []
  return selectedPark.value ? tasks.filter((task) => task.parkName === selectedPark.value) : tasks
})

function formatPlanDate(raw: string) {
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return raw
  return `${Number(match[2])} 月 ${Number(match[3])} 日`
}

function statusText(task: MaintenanceTask) {
  if (task.status === 'active') return task.deadline || '处理中'
  if (task.status === 'pending') return '待接单'
  return '已完成'
}

function statusIcon(task: MaintenanceTask) {
  if (task.status === 'active') return 'ri-loader-2-line'
  if (task.status === 'pending') return 'ri-time-line'
  return 'ri-checkbox-circle-fill'
}

function statusIconColor(task: MaintenanceTask) {
  if (task.status === 'pending') return '#fa7319'
  if (task.status === 'completed') return '#1fc16b'
  return isDark.value ? '#e5e5e5' : '#171717'
}

async function loadTasks() {
  loading.value = true
  errorMessage.value = ''
  try {
    const session = getStoredSession()
    if (!session || session.role !== 'maintainer') {
      goLogin()
      return
    }
    currentUserName.value = session.displayName
    currentUserAvatar.value = session.avatarUrl || '/static/avatar-maintainer-default.png'
    currentTrade.value = session.specialty || 'electric'
    currentTradeLabel.value = session.specialtyLabel || '电工'
    const data = await fetchMaintenanceTaskList(currentTrade.value)
    sections.value = data.sections
  } catch {
    sections.value = []
    errorMessage.value = '维修任务加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function onLogout() {
  clearSession()
  goLogin()
}

onShow(() => {
  loadTasks()
})
</script>

<template>
  <view class="app-page" :class="{ 'theme-dark': isDark }">
    <view class="shell safe-top" :style="safeAreaVars">
      <scroll-view scroll-y class="page-scroll">
        <view class="topbar">
          <view class="brand-wrap">
            <image class="brand-logo" src="/static/temp_logo.png" mode="aspectFit" />
            <text class="brand-name">BuildGuard</text>
          </view>
          <UserCardMenu
            :name="currentUserName"
            :avatar-url="currentUserAvatar"
            :completed-count="completedCount"
            @logout="onLogout"
            @switch-identity="onLogout"
          />
        </view>

        <view v-if="loading" class="state-card">
          <AppIcon name="ri-loader-4-line" class="state-icon spinner" color="#5c5c5c" />
          <text class="text-muted">正在加载维修任务…</text>
        </view>

        <view v-else-if="errorMessage" class="state-card">
          <AppIcon name="ri-error-warning-line" class="state-icon error" color="#e5484d" />
          <text class="text-muted">{{ errorMessage }}</text>
          <view class="btn btn-primary retry-btn" @tap="loadTasks">重试</view>
        </view>

        <template v-else-if="sections.every((section) => section.tasks.length === 0)">
          <view class="card intro-card">
            <view class="chip-row">
              <text class="chip">维修身份</text>
              <text class="trade-chip">{{ currentTradeLabel }}</text>
            </view>
            <text class="intro-title">维修任务工作台</text>
            <text class="intro-copy">维修工单由检修异常项派发而来，当前账号仅展示 {{ currentTradeLabel }} 相关任务。</text>
          </view>
          <view class="card empty-card">
            <view class="empty-icon-wrap">
              <AppIcon name="ri-tools-line" class="empty-icon" :color="isDark ? '#a3a3a3' : '#5c5c5c'" />
            </view>
            <text class="empty-title">暂无{{ currentTradeLabel }}维修任务</text>
            <text class="empty-copy">当前没有分配给 {{ currentTradeLabel }} 的维修任务，你可以稍后刷新或切换其他演示账号查看。</text>
          </view>
        </template>

        <template v-else>
          <view class="card task-card">
            <view
              v-for="(task, index) in activeSection?.tasks"
              :key="task.id"
              class="task-item"
              :class="{ divided: index > 0 }"
              @tap="goMaintenanceDetail(task.id)"
            >
              <view class="task-head">
                <view class="task-copy">
                  <text class="task-park">{{ task.parkName }}</text>
                  <text class="task-name">{{ task.taskName }}</text>
                </view>
                <view class="task-status-chip">
                  <AppIcon :name="statusIcon(task)" :color="statusIconColor(task)" />
                  <text class="task-status-text">{{ statusText(task) }}</text>
                </view>
              </view>
              <text class="task-address">{{ task.buildingName }} · {{ task.location }}</text>
              <text class="task-subtle">来源：{{ task.sourceInspectionTask }} · {{ task.sourceFinding }}</text>
              <view class="btn btn-primary inline-btn">查看维修详情</view>
            </view>

            <view class="segment-divider" />

            <view class="pending-wrap">
              <view
                v-for="(task, index) in pendingSection?.tasks"
                :key="task.id"
                class="task-item"
                :class="{ divided: index > 0 }"
                @tap="goMaintenanceDetail(task.id)"
              >
                <view class="task-head">
                  <view class="task-copy">
                    <text class="task-park">{{ task.parkName }}</text>
                    <text class="task-name">{{ task.taskName }}</text>
                  </view>
                  <view class="task-status-chip">
                    <AppIcon :name="statusIcon(task)" :color="statusIconColor(task)" />
                    <text class="task-status-text">{{ statusText(task) }}</text>
                  </view>
                </view>
                <text class="task-address">{{ task.buildingName }} · {{ task.location }}</text>
              </view>
            </view>

            <view class="card-foot">
              <view class="btn btn-surface" @tap="showPlannedSheet = true">查看更多计划维修任务</view>
            </view>
          </view>

          <view class="record-head">
            <text class="record-title">维修记录</text>
            <view class="filter-pill" :class="{ active: !!selectedPark }" @tap="showFilterSheet = true">
              <AppIcon name="ri-filter-3-line" :color="selectedPark ? (isDark ? '#171717' : '#ffffff') : isDark ? '#a3a3a3' : '#5c5c5c'" />
              <text>{{ selectedPark || '园区筛选' }}</text>
            </view>
          </view>

          <view class="record-list">
            <view
              v-for="task in filteredCompletedTasks"
              :key="task.id"
              class="card record-card"
              @tap="goMaintenanceDetail(task.id)"
            >
              <view class="task-head">
                <view class="task-copy">
                  <text class="task-park">{{ task.parkName }}</text>
                  <text class="task-name">{{ task.taskName }}</text>
                </view>
                <view class="task-status-chip">
                  <AppIcon :name="statusIcon(task)" :color="statusIconColor(task)" />
                  <text class="task-status-text">{{ statusText(task) }}</text>
                </view>
              </view>
              <text class="task-address">{{ task.buildingName }} · {{ task.location }}</text>
            </view>
          </view>
        </template>
      </scroll-view>
    </view>

    <BaseSheet :visible="showFilterSheet" title="筛选园区" @close="showFilterSheet = false">
      <view class="sheet-option-list">
        <view class="sheet-option" :class="{ active: !selectedPark }" @tap="selectedPark = null; showFilterSheet = false">
          <text>全部园区</text>
          <text class="sheet-option-subtext">显示全部记录</text>
        </view>
        <view
          v-for="park in parkNames"
          :key="park"
          class="sheet-option"
          :class="{ active: selectedPark === park }"
          @tap="selectedPark = park; showFilterSheet = false"
        >
          <text>{{ park }}</text>
          <text class="sheet-option-subtext">仅查看该园区</text>
        </view>
      </view>
    </BaseSheet>

    <BaseSheet :visible="showPlannedSheet" title="未来计划维修任务" @close="showPlannedSheet = false">
      <scroll-view scroll-y class="planned-scroll">
        <view class="timeline-sheet">
          <view v-if="!plannedTasks.length" class="timeline-empty">暂无计划维修任务</view>
          <view v-else class="timeline-list">
            <view
              v-for="(task, index) in plannedTasks"
              :key="task.id"
              class="timeline-row"
              @tap="goMaintenanceDetail(task.id)"
            >
              <view class="timeline-track">
                <view class="timeline-dot" :class="{ active: task.status === 'active' }" />
                <view v-if="index < plannedTasks.length - 1" class="timeline-line" />
              </view>
              <view class="timeline-copy">
                <text class="timeline-date">{{ formatPlanDate(task.plannedAt || task.deadline || '') }}</text>
                <view class="timeline-heading">
                  <text class="timeline-title">{{ task.parkName }}</text>
                  <view class="task-status-chip">
                    <AppIcon :name="statusIcon(task)" :color="statusIconColor(task)" />
                    <text class="task-status-text">{{ task.status === 'active' ? statusText(task) : '待接单' }}</text>
                  </view>
                </view>
                <text class="timeline-subtitle">{{ task.taskName }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </BaseSheet>
  </view>
</template>

<style scoped>
.page-scroll {
  flex: 1;
  padding: 0 32rpx 24rpx;
  box-sizing: border-box;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.brand-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.brand-logo {
  width: 80rpx;
  height: 80rpx;
  border-radius: 18rpx;
}

.brand-name {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.state-card,
.empty-card {
  min-height: 380rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.intro-card,
.empty-card,
.task-card,
.record-card {
  padding: 24rpx;
  margin-top: 16rpx;
}

.chip-row {
  display: flex;
  gap: 12rpx;
}

.trade-chip {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: var(--bg-chip-info);
  color: var(--brand-blue);
  font-size: 22rpx;
}

.empty-icon-wrap {
  width: 112rpx;
  height: 112rpx;
  border-radius: 32rpx;
  background: var(--bg-softer);
  display: flex;
  align-items: center;
  justify-content: center;
}

.intro-title,
.empty-title {
  display: block;
  margin-top: 16rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.intro-copy,
.empty-copy {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: var(--text-secondary);
}

.empty-copy {
  max-width: 480rpx;
  text-align: center;
}

.empty-icon,
.state-icon {
  font-size: 56rpx;
  color: var(--text-quaternary);
}

.state-icon.error {
  color: #e5484d;
}

.retry-btn {
  width: 180rpx;
}

.task-card {
  overflow: hidden;
}

.task-item {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 24rpx 0;
}

.task-item.divided {
  border-top: 1px solid var(--border-subtle);
}

.task-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.task-copy {
  flex: 1;
}

.task-park {
  display: block;
  font-size: 30rpx;
  line-height: 42rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.task-name {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: var(--text-secondary);
}

.task-address,
.task-subtle {
  font-size: 24rpx;
  line-height: 36rpx;
  color: var(--text-secondary);
}

.task-subtle {
  color: var(--text-tertiary);
}

.inline-btn {
  height: 80rpx;
}

.pending-wrap {
  margin: 0 -24rpx;
  padding: 0 24rpx;
  background: var(--bg-soft);
}

.card-foot {
  padding-top: 24rpx;
  border-top: 1px solid var(--border-subtle);
}

.record-head {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.record-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--text-secondary);
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: transparent;
  font-size: 22rpx;
  color: var(--text-secondary);
}

.filter-pill.active {
  background: var(--text-primary);
  color: var(--bg-card);
}

.record-list {
  padding-bottom: 24rpx;
}

.planned-scroll {
  max-height: 60vh;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
