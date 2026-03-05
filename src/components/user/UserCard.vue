<script setup lang="ts">
defineProps<{
  name: string
  completedCount: number
}>()
</script>

<template>
  <div class="px-4 pb-2 pt-3">
    <div class="flex items-center gap-2">
      <div class="avatar-border h-[44px] w-[44px] shrink-0 rounded-[6px] bg-[#C4C4C4]" />
      <div class="flex flex-col gap-1">
        <span class="text-[16px] font-medium leading-[24px] text-[#171717]">{{ name }}</span>
        <span class="text-[12px] leading-[16px] text-[#5C5C5C]">已完成 {{ completedCount }} 任务</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-border {
  box-shadow: inset 0 0 0 1px #FFFFFF;
}
</style>
