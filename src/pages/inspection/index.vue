<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BaseSheet from '@/components/common/BaseSheet.vue'
import UserCardMenu from '@/components/common/UserCardMenu.vue'
import { getStoredSession, clearSession } from '@/shared/auth/session'
import { fetchTaskList } from '@/shared/api/task'
import type { TaskSection } from '@/shared/types/task'
import { goLogin, goTaskDetail } from '@/services/platform/navigation'
import { useTheme } from '@/services/platform/theme'

const sections = ref<TaskSection[]>([])
const loading = ref(true)
const errorMessage = ref('')
const showFilterSheet = ref(false)
const showPlannedSheet = ref(false)
const selectedPark = ref<string | null>(null)
const currentUserName = ref('张检修')
const currentUserAvatar = ref('/static/avatar-inspector-default.png')
const isEmptyDemo = ref(false)
const { isDark } = useTheme()

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

async function loadTasks() {
  loading.value = true
  errorMessage.value = ''
  try {
    const session = getStoredSession()
    currentUserName.value = session?.displayName || '张检修'
    currentUserAvatar.value = session?.avatarUrl || '/static/avatar-inspector-default.png'
    isEmptyDemo.value = session?.demoMode === 'empty'
    if (!session || session.role !== 'inspector') {
      goLogin()
      return
    }
    if (session.demoMode === 'empty') {
      sections.value = []
      return
    }
    const data = await fetchTaskList()
    sections.value = data.sections
  } catch {
    sections.value = []
    errorMessage.value = '任务列表加载失败，请稍后重试'
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
    <view class="shell safe-top">
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
          <text class="app-icon ri-loader-4-line state-icon spinner" />
          <text class="text-muted">正在加载任务列表…</text>
        </view>

        <view v-else-if="errorMessage" class="state-card">
          <text class="app-icon ri-error-warning-line state-icon error" />
          <text class="text-muted">{{ errorMessage }}</text>
          <view class="btn btn-primary retry-btn" @tap="loadTasks">重试</view>
        </view>

        <template v-else-if="sections.length === 0">
          <view class="card intro-card">
            <text class="chip">检修身份</text>
            <text class="intro-title">检修任务工作台</text>
            <text class="intro-copy">
              {{ isEmptyDemo
                ? '当前账号专用于空状态样式演示，方便确认检修工作台在无任务时的布局和文案表现。'
                : '当前暂无可处理的检修任务，后续接入新任务后会在这里展示待处理、进行中和已完成数据。' }}
            </text>
          </view>
          <view class="card empty-card">
            <text class="app-icon ri-survey-line empty-icon" />
            <text class="empty-title">暂无检修任务</text>
            <text class="empty-copy">
              {{ isEmptyDemo
                ? '这是检修身份的空状态演示账号。后续如果接入新的检修任务数据，这里会替换为真实任务列表与处理入口。'
                : '当前没有检修任务需要处理。你可以稍后刷新，或切换到其他演示账号查看已有任务数据。' }}
            </text>
          </view>
        </template>

        <template v-else>
          <view class="card task-card">
            <view
              v-for="(task, index) in activeSection?.tasks"
              :key="task.id"
              class="task-item"
              :class="{ divided: index > 0 }"
              @tap="goTaskDetail(task.id)"
            >
              <view class="task-head">
                <view class="task-copy">
                  <text class="task-park">{{ task.parkName }}</text>
                  <text class="task-name">{{ task.taskName }}</text>
                  <text v-if="task.address" class="task-address">{{ task.address }}</text>
                </view>
                <view class="status-chip">
                  <text class="app-icon ri-loader-2-line" />
                  <text>{{ task.deadline }}</text>
                </view>
              </view>
              <view class="btn btn-primary inline-btn">开始巡检</view>
            </view>

            <view class="divider" />

            <view class="pending-wrap">
              <view
                v-for="(task, index) in pendingSection?.tasks"
                :key="task.id"
                class="task-item"
                :class="{ divided: index > 0 }"
                @tap="goTaskDetail(task.id)"
              >
                <view class="task-head">
                  <view class="task-copy">
                    <text class="task-park">{{ task.parkName }}</text>
                    <text class="task-name">{{ task.taskName }}</text>
                    <text v-if="task.address" class="task-address">{{ task.address }}</text>
                  </view>
                  <view class="status-chip pending">
                    <text class="app-icon ri-time-fill" />
                    <text>{{ task.deadline }}</text>
                  </view>
                </view>
              </view>
            </view>

            <view class="card-foot">
              <view class="btn btn-secondary" @tap="showPlannedSheet = true">查看更多计划巡检任务</view>
            </view>
          </view>

          <view class="record-head">
            <text class="record-title">巡检记录</text>
            <view class="filter-pill" @tap="showFilterSheet = true">
              <text class="app-icon ri-filter-3-line" />
              <text>{{ selectedPark || '园区筛选' }}</text>
            </view>
          </view>

          <view class="record-list">
            <view
              v-for="task in filteredCompletedTasks"
              :key="task.id"
              class="card record-card"
              @tap="goTaskDetail(task.id)"
            >
              <view class="task-head">
                <view class="task-copy">
                  <text class="task-park">{{ task.parkName }}</text>
                  <text class="task-name">{{ task.taskName }}</text>
                  <text v-if="task.address" class="task-address">{{ task.address }}</text>
                </view>
                <view class="status-chip complete">
                  <text class="app-icon ri-checkbox-circle-fill" />
                  <text>{{ task.completedAt }}</text>
                </view>
              </view>
            </view>
          </view>
        </template>
      </scroll-view>
    </view>

    <BaseSheet :visible="showFilterSheet" title="筛选园区" @close="showFilterSheet = false">
      <view class="sheet-list">
        <view class="sheet-item" @tap="selectedPark = null; showFilterSheet = false">全部园区</view>
        <view
          v-for="park in parkNames"
          :key="park"
          class="sheet-item"
          @tap="selectedPark = park; showFilterSheet = false"
        >
          {{ park }}
        </view>
      </view>
    </BaseSheet>

    <BaseSheet :visible="showPlannedSheet" title="计划巡检任务" @close="showPlannedSheet = false">
      <scroll-view scroll-y class="planned-scroll">
        <view v-for="task in plannedTasks" :key="task.id" class="sheet-plan">
          <text class="sheet-plan-title">{{ task.taskName }}</text>
          <text class="sheet-plan-copy">{{ task.parkName }} · {{ task.deadline }}</text>
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

.intro-title,
.empty-title {
  display: block;
  margin-top: 16rpx;
  font-size: 36rpx;
  font-weight: 700;
}

.intro-copy,
.empty-copy {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: #5c5c5c;
}

.empty-copy {
  max-width: 480rpx;
  text-align: center;
}

.empty-icon,
.state-icon {
  font-size: 56rpx;
  color: #a3a3a3;
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
  gap: 24rpx;
  padding: 24rpx 0;
}

.task-item.divided {
  border-top: 1px solid #ebebeb;
}

.task-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.task-copy {
  flex: 1;
  min-width: 0;
}

.task-park {
  display: block;
  font-size: 30rpx;
  line-height: 42rpx;
  font-weight: 600;
}

.task-name,
.task-address {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: #5c5c5c;
}

.status-chip {
  flex-shrink: 0;
  padding: 10rpx 16rpx;
  border-radius: 14rpx;
  border: 1px solid #ebebeb;
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  background: #fff;
}

.status-chip.pending {
  color: #fa7319;
}

.status-chip.complete {
  color: #1fc16b;
}

.inline-btn {
  height: 80rpx;
}

.divider {
  height: 12rpx;
  background: rgba(0, 0, 0, 0.05);
  margin: 0 -24rpx;
}

.pending-wrap {
  margin: 0 -24rpx;
  padding: 0 24rpx;
  background: rgba(0, 0, 0, 0.05);
}

.card-foot {
  padding-top: 24rpx;
  border-top: 1px solid #ebebeb;
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
  color: rgba(60, 60, 67, 0.6);
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(0, 0, 0, 0.06);
  font-size: 22rpx;
  color: #5c5c5c;
}

.record-list {
  padding-bottom: 24rpx;
}

.sheet-list {
  padding: 0 32rpx 24rpx;
}

.sheet-item {
  height: 84rpx;
  display: flex;
  align-items: center;
  font-size: 28rpx;
}

.sheet-item + .sheet-item {
  border-top: 1px solid #ebebeb;
}

.planned-scroll {
  max-height: 60vh;
  padding: 0 32rpx 24rpx;
}

.sheet-plan + .sheet-plan {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1px solid #ebebeb;
}

.sheet-plan-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}

.sheet-plan-copy {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  line-height: 34rpx;
  color: #5c5c5c;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
