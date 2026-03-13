<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchMaintenanceTaskDetail } from '../../api/maintenance'
import type { MaintenanceStep, MaintenanceTaskDetail } from '../../types/maintenance'
import MaintenanceExecutionDrawer from './MaintenanceExecutionDrawer.vue'
import MaintenanceResultDrawer from './MaintenanceResultDrawer.vue'

const route = useRoute()
const router = useRouter()

const task = ref<MaintenanceTaskDetail | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const notFound = ref(false)
const beforeMedia = ref<string[]>([])
const afterMedia = ref<string[]>([])
const executionNote = ref('')
const executionDrawerVisible = ref(false)
const resultDrawerVisible = ref(false)

const taskId = computed(() => Number(route.params.id))

const statusLabel = computed(() => {
  if (!task.value) return ''
  switch (task.value.status) {
    case 'active': return '处理中'
    case 'pending': return '待接单'
    case 'completed': return '已完成'
  }
})

const statusIcon = computed(() => {
  if (!task.value) return ''
  switch (task.value.status) {
    case 'active': return 'ri-loader-2-line'
    case 'pending': return 'ri-time-line'
    case 'completed': return 'ri-checkbox-circle-fill'
  }
})

const statusIconColor = computed(() => {
  if (!task.value) return ''
  switch (task.value.status) {
    case 'active': return 'text-[#171717] dark:text-[#E5E5E5]'
    case 'pending': return 'text-[#FA7319]'
    case 'completed': return 'text-[#1FC16B]'
  }
})

function stepIcon(step: MaintenanceStep) {
  switch (step.status) {
    case 'done': return 'ri-checkbox-circle-fill'
    case 'active': return 'ri-loader-2-line'
    case 'pending': return 'ri-time-line'
  }
}

function stepIconColor(step: MaintenanceStep) {
  switch (step.status) {
    case 'done': return 'text-[#1FC16B]'
    case 'active': return 'text-[#171717] dark:text-[#E5E5E5]'
    case 'pending': return 'text-[#FA7319]'
  }
}

function stepStatusText(step: MaintenanceStep) {
  switch (step.status) {
    case 'done': return '已完成'
    case 'active': return '处理中'
    case 'pending': return '待执行'
  }
}

const detailTimeText = computed(() => {
  if (!task.value) return ''
  if (task.value.status === 'completed' && task.value.completedAt) return `${task.value.completedAt} 完成维修`
  if (task.value.status === 'pending' && task.value.plannedAt) return `计划开始 ${task.value.plannedAt}`
  return task.value.deadline || ''
})

function parseTaskDate(value: string): Date | null {
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  }
  const monthDayMatch = value.match(/(\d+)\s*月\s*(\d+)\s*日/)
  if (!monthDayMatch) return null
  const year = new Date().getFullYear()
  return new Date(year, Number(monthDayMatch[1]) - 1, Number(monthDayMatch[2]))
}

const timeRemainingLabel = computed(() => {
  const currentTask = task.value
  if (!currentTask || currentTask.status === 'completed') return null

  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  if (currentTask.status === 'pending') {
    const startDate = currentTask.plannedAt ? parseTaskDate(currentTask.plannedAt) : null
    if (!startDate) return null
    const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    if (diffDays < 0) return '已可开始'
    if (diffDays === 0) return '今天开始'
    return `还有${diffDays}天开始`
  }

  const endDate = currentTask.deadline ? parseTaskDate(currentTask.deadline) : null
  if (!endDate) return null
  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (diffDays < 0) return '已逾期'
  if (diffDays === 0) return '今天到期'
  return `还剩${diffDays}天`
})

type BottomAction = { key: 'call' | 'accept' | 'complete' | 'summary'; label: string; primary?: boolean }
const bottomActions = computed((): BottomAction[] => {
  if (!task.value) return []
  switch (task.value.status) {
    case 'pending':
      return [
        { key: 'call', label: '电话联系' },
        { key: 'accept', label: '接单处理', primary: true },
      ]
    case 'active':
      return [
        { key: 'call', label: '电话联系' },
        { key: 'complete', label: '标记完成', primary: true },
      ]
    case 'completed':
      return [
        { key: 'call', label: '电话联系' },
        { key: 'summary', label: '查看结论', primary: true },
      ]
  }
})

function onCall() {
  if (!task.value?.phone) return
  window.location.href = `tel:${task.value.phone}`
}

function onAccept() {
  if (!task.value || task.value.status !== 'pending') return
  task.value.status = 'active'
  const firstPendingStep = task.value.steps.find((step) => step.status === 'pending')
  if (firstPendingStep) firstPendingStep.status = 'active'
}

async function onComplete() {
  if (!task.value || task.value.status !== 'active') return
  executionDrawerVisible.value = true
}

function onViewSummary() {
  resultDrawerVisible.value = true
}

function onSaveExecutionRecord(payload: { beforeMedia: string[]; afterMedia: string[]; executionNote: string }) {
  if (!task.value) return
  beforeMedia.value = payload.beforeMedia
  afterMedia.value = payload.afterMedia
  executionNote.value = payload.executionNote
  task.value.beforeMedia = payload.beforeMedia
  task.value.afterMedia = payload.afterMedia
  task.value.executionNote = payload.executionNote
  task.value.status = 'completed'
  task.value.completedAt = new Date().toISOString().slice(0, 10)
  task.value.steps.forEach((step) => { step.status = 'done' })
  if (!task.value.completionSummary) task.value.completionSummary = '维修处理已完成，现场复核通过，可恢复正常使用。'
  executionDrawerVisible.value = false
  resultDrawerVisible.value = true
}

async function handleBottomAction(action: BottomAction['key']) {
  switch (action) {
    case 'call':
      onCall()
      break
    case 'accept':
      onAccept()
      break
    case 'complete':
      await onComplete()
      break
    case 'summary':
      onViewSummary()
      break
  }
}

async function loadTask(id: number) {
  loading.value = true
  errorMessage.value = ''
  notFound.value = false
  executionDrawerVisible.value = false
  resultDrawerVisible.value = false
  task.value = null

  if (!Number.isFinite(id) || id <= 0) {
    notFound.value = true
    loading.value = false
    return
  }

  try {
    const data = await fetchMaintenanceTaskDetail(id)
    if (!data) {
      notFound.value = true
      return
    }
    task.value = data
    beforeMedia.value = data.beforeMedia ? [...data.beforeMedia] : []
    afterMedia.value = data.afterMedia ? [...data.afterMedia] : []
    executionNote.value = data.executionNote ?? ''
  } catch {
    errorMessage.value = '维修任务加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

watch(taskId, (id) => { loadTask(id) }, { immediate: true })
</script>

<template>
  <section class="mx-auto flex h-screen w-full max-w-[430px] flex-col bg-[#EBEBEB] dark:bg-[#171717]">
    <div class="flex flex-1 flex-col overflow-y-auto px-4">
      <template v-if="loading">
        <div class="flex flex-1 items-center justify-center">
          <div class="flex flex-col items-center gap-2">
            <i class="ri-loader-4-line animate-spin text-[32px] text-[#A3A3A3]" />
            <span class="text-[14px] text-[#A3A3A3]">加载中…</span>
          </div>
        </div>
      </template>

      <template v-else-if="errorMessage">
        <div class="flex flex-1 flex-col items-center justify-center gap-3 py-10">
          <i class="ri-error-warning-line text-[32px] text-[#E5484D]" />
          <p class="text-[14px] text-[#5C5C5C] dark:text-[#A3A3A3]">{{ errorMessage }}</p>
          <button
            type="button"
            class="btn-base btn-primary h-10 px-4 text-[14px] leading-[20px]"
            @click="loadTask(taskId)"
          >
            重试
          </button>
        </div>
      </template>

      <template v-else-if="notFound">
        <div class="flex flex-1 flex-col items-center justify-center gap-3 py-10">
          <i class="ri-file-search-line text-[32px] text-[#A3A3A3]" />
          <p class="text-[14px] text-[#5C5C5C] dark:text-[#A3A3A3]">维修任务不存在或已被删除</p>
          <button
            type="button"
            class="btn-base btn-primary h-10 px-4 text-[14px] leading-[20px]"
            @click="router.replace('/maintenance')"
          >
            返回维修工作台
          </button>
        </div>
      </template>

      <template v-else-if="task">
        <div class="card-shadow mt-4 flex flex-col rounded-xl bg-white p-4 dark:bg-[#262626]">
          <div class="flex items-start">
            <div class="flex min-w-0 flex-1 flex-col">
              <span class="text-[16px] font-medium leading-[24px] text-[#171717] dark:text-[#E5E5E5]">
                {{ task.parkName }}
              </span>
              <span class="text-[13px] leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">
                {{ task.taskName }}
              </span>
            </div>
            <div class="task-status-chip">
              <i :class="[statusIcon, 'text-[16px] leading-[16px]', statusIconColor]" />
              <span class="task-status-text">{{ statusLabel }}</span>
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <i class="ri-map-pin-line text-[20px] leading-[20px] text-[#A3A3A3]" />
              <span class="text-[14px] font-medium leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">
                {{ task.buildingName }} · {{ task.location }}
              </span>
            </div>
            <div v-if="task.address" class="flex items-center gap-2">
              <i class="ri-road-map-line text-[20px] leading-[20px] text-[#A3A3A3]" />
              <span class="text-[14px] font-medium leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">
                {{ task.address }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <i class="ri-calendar-line text-[20px] leading-[20px] text-[#A3A3A3]" />
              <span class="text-[14px] font-medium leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">
                {{ detailTimeText }}
              </span>
              <span
                v-if="timeRemainingLabel"
                class="rounded-md bg-[#F5F5F5] px-1.5 py-0.5 text-[11px] font-medium leading-[16px] text-[#5C5C5C] dark:bg-[#404040] dark:text-[#A3A3A3]"
              >
                {{ timeRemainingLabel }}
              </span>
            </div>
          </div>

        </div>

        <div class="segment-divider my-4 shrink-0" />

        <div class="card-shadow rounded-xl bg-white p-4 dark:bg-[#262626]">
          <h2 class="text-[16px] font-bold leading-[24px] text-[#171717] dark:text-[#E5E5E5]">来源巡检问题</h2>
          <div class="mt-4 flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <i class="ri-file-list-3-line text-[18px] leading-[18px] text-[#A3A3A3]" />
              <span class="text-[14px] leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">{{ task.sourceInspectionTask }}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="ri-alert-line text-[18px] leading-[18px] text-[#A3A3A3]" />
              <span class="text-[14px] leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">{{ task.issueCategory }} · {{ task.riskLevelLabel }}</span>
            </div>
          </div>
          <div class="mt-4 rounded-xl bg-[#F5F5F5] px-3 py-3 dark:bg-[#404040]">
            <div class="flex items-center gap-2">
              <span class="text-[14px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">{{ task.sourceInspectionItem }}</span>
              <span class="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#5C5C5C] dark:bg-[#262626] dark:text-[#A3A3A3]">
                {{ task.sourceStatusLabel }}
              </span>
            </div>
            <p class="mt-2 text-[13px] leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">
              {{ task.sourceDescription }}
            </p>
            <p class="mt-2 text-[13px] leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">
              影响说明：{{ task.sourceImpact }}
            </p>
            <p v-if="task.sourceRemark" class="mt-2 text-[13px] leading-[20px] text-[#737373] dark:text-[#A3A3A3]">
              现场备注：{{ task.sourceRemark }}
            </p>
          </div>
          <div v-if="task.sourcePhotos?.length" class="mt-3 grid grid-cols-2 gap-2">
            <img
              v-for="photo in task.sourcePhotos"
              :key="photo"
              :src="photo"
              alt="巡检现场照片"
              class="h-[120px] w-full rounded-xl object-cover"
            />
          </div>
          <p class="mt-3 rounded-xl bg-[#F5F5F5] px-3 py-3 text-[13px] leading-[20px] text-[#5C5C5C] dark:bg-[#404040] dark:text-[#A3A3A3]">
            {{ task.dispatchReason }}
          </p>
          <p class="mt-3 text-[13px] leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">
            异常描述：{{ task.sourceFinding }}
          </p>
        </div>

        <div class="card-shadow mt-4 rounded-xl bg-white p-4 dark:bg-[#262626]">
          <h2 class="text-[16px] font-bold leading-[24px] text-[#171717] dark:text-[#E5E5E5]">维修处理信息</h2>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-[#F5F5F5] px-3 py-3 dark:bg-[#404040]">
              <p class="text-[12px] leading-[16px] text-[#737373] dark:text-[#A3A3A3]">工单编号</p>
              <p class="mt-1 text-[13px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">{{ task.workOrderNo }}</p>
            </div>
            <div class="rounded-xl bg-[#F5F5F5] px-3 py-3 dark:bg-[#404040]">
              <p class="text-[12px] leading-[16px] text-[#737373] dark:text-[#A3A3A3]">现场联系人</p>
              <p class="mt-1 text-[13px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">{{ task.contact || '-' }}</p>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-[13px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">工具与材料</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="item in [...task.requiredTools, ...task.requiredMaterials]"
                :key="item"
                class="rounded-full bg-[#F5F5F5] px-2 py-1 text-[12px] leading-[16px] text-[#5C5C5C] dark:bg-[#404040] dark:text-[#A3A3A3]"
              >
                {{ item }}
              </span>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-[13px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">安全提醒</p>
            <div class="mt-2 flex flex-col gap-2">
              <div
                v-for="note in task.safetyNotes"
                :key="note"
                class="flex items-start gap-2 rounded-xl bg-[#FFF7E6] px-3 py-3 dark:bg-[#3D2B1F]"
              >
                <i class="ri-shield-check-line mt-0.5 text-[16px] leading-[16px] text-[#FA7319]" />
                <span class="text-[13px] leading-[20px] text-[#5C5C5C] dark:text-[#E5E5E5]">{{ note }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card-shadow mt-4 overflow-hidden rounded-xl bg-white dark:bg-[#262626]">
          <div class="px-4 py-4">
            <h2 class="text-[16px] font-bold leading-[24px] text-[#171717] dark:text-[#E5E5E5]">处理步骤</h2>
          </div>
          <div
            v-for="(step, index) in task.steps"
            :key="step.id"
            class="px-4"
          >
            <div class="py-4" :class="index > 0 ? 'border-t border-[#EBEBEB] dark:border-white/10' : ''">
              <div class="flex items-start gap-3">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] dark:bg-[#404040]">
                  <i :class="[stepIcon(step), 'text-[18px] leading-[18px]', stepIconColor(step)]" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-[14px] font-medium leading-[20px] text-[#171717] dark:text-[#E5E5E5]">{{ step.title }}</span>
                    <span class="text-[12px] leading-[16px]" :class="stepIconColor(step)">{{ stepStatusText(step) }}</span>
                  </div>
                  <p class="mt-1 text-[13px] leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">{{ step.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pb-8" />
      </template>
    </div>

    <div
      v-if="task && bottomActions.length"
      class="bottom-actions shrink-0 border-t border-[rgba(0,0,0,0.08)] bg-white p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] dark:border-white/10 dark:bg-[#262626]"
    >
      <div class="flex gap-2">
        <button
          v-for="action in bottomActions"
          :key="action.key"
          type="button"
          class="btn-base btn-md min-w-0 flex-1"
          :class="action.primary ? 'btn-primary' : 'btn-secondary'"
          :disabled="action.key === 'call' && !task.phone"
          @click="handleBottomAction(action.key)"
        >
          <span>{{ action.label }}</span>
        </button>
      </div>
    </div>

    <MaintenanceExecutionDrawer
      :visible="executionDrawerVisible"
      :before-media="beforeMedia"
      :after-media="afterMedia"
      :execution-note="executionNote"
      @close="executionDrawerVisible = false"
      @save="onSaveExecutionRecord"
    />

    <MaintenanceResultDrawer
      :visible="resultDrawerVisible"
      :task="task"
      @close="resultDrawerVisible = false"
    />
  </section>
</template>

<style scoped>
.card-shadow {
  box-shadow:
    0px 0px 0px 1px rgba(23, 23, 23, 0.08),
    0px 1px 1px -0.5px rgba(23, 23, 23, 0.04),
    0px 3px 3px -1.5px rgba(23, 23, 23, 0.04),
    0px 6px 6px -3px rgba(23, 23, 23, 0.04),
    0px 10px 10px -5px rgba(23, 23, 23, 0.04),
    0px 20px 20px -10px rgba(23, 23, 23, 0.04),
    inset 0px -1px 1px -0.5px rgba(23, 23, 23, 0.06);
}

.segment-divider {
  height: 1px;
  background-image: repeating-linear-gradient(
    to right,
    rgba(0, 0, 0, 0.1) 0,
    rgba(0, 0, 0, 0.1) 4px,
    transparent 4px,
    transparent 8px
  );
}
</style>
