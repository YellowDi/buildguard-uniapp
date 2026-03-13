<script setup lang="ts">
import { computed } from 'vue'
import UserCard from '../user/UserCard.vue'
import { getStoredSession } from '../../auth/session'

const currentUser = getStoredSession()

const currentUserName = computed(() => currentUser?.displayName || '李维修')
const currentUserAvatar = computed(() => currentUser?.avatarUrl || '/avatar-maintainer-default.png')
const isEmptyDemo = computed(() => currentUser?.demoMode === 'empty')
</script>

<template>
  <section class="mx-auto flex h-screen w-full max-w-[430px] flex-col">
    <div class="flex flex-1 flex-col overflow-y-auto pb-6">
      <div class="flex items-center justify-between px-4 pt-3">
        <div class="min-w-0 flex flex-1 items-center gap-2">
          <img
            src="/temp_logo.png"
            alt="BuildGuard logo"
            class="h-10 w-10 flex-shrink-0 rounded-lg object-contain shadow-sm"
            title="BuildGuard"
          />
          <span class="truncate text-base font-semibold text-[#171717] dark:text-[#E5E5E5]">
            BuildGuard
          </span>
        </div>
        <UserCard :name="currentUserName" :avatar-url="currentUserAvatar" :completed-count="0" />
      </div>

      <div class="px-4 pt-4">
        <div class="card-shadow rounded-xl bg-white p-4 dark:bg-[#262626]">
          <div class="inline-flex items-center rounded-full bg-[#F5F5F5] px-2 py-1 text-[12px] font-medium text-[#5C5C5C] dark:bg-[#404040] dark:text-[#A3A3A3]">
            维修身份
          </div>
          <h1 class="mt-3 text-[18px] font-semibold leading-[26px] text-[#171717] dark:text-[#E5E5E5]">
            维修任务工作台
          </h1>
          <p class="mt-2 text-[13px] leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">
            {{ isEmptyDemo
              ? '当前账号专用于空状态样式演示，方便确认维修工作台在无任务时的布局表现。'
              : '当前为临时测试入口。维修任务的数据、流程和处理动作后续再接入，这里先保留空状态页面。'
            }}
          </p>
        </div>

        <div class="card-shadow mt-4 flex min-h-[420px] flex-col items-center justify-center rounded-xl bg-white px-6 py-10 text-center dark:bg-[#262626]">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F5] dark:bg-[#404040]">
            <i class="ri-tools-line text-[28px] text-[#5C5C5C] dark:text-[#A3A3A3]" />
          </div>
          <h2 class="mt-4 text-[16px] font-medium leading-[24px] text-[#171717] dark:text-[#E5E5E5]">
            暂无维修任务
          </h2>
          <p class="mt-2 max-w-[240px] text-[13px] leading-[20px] text-[#5C5C5C] dark:text-[#A3A3A3]">
            {{ isEmptyDemo
              ? '这是维修身份的空状态演示账号。后续如果接入维修任务数据，这里会替换为真实列表和处理流程。'
              : '检修身份可查看当前已有任务数据；维修身份后续将承接维修派单、处理记录等独立流程。'
            }}
          </p>
        </div>
      </div>
    </div>
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
</style>
