<script setup lang="ts">
type RiskLevel = 'danger' | 'warning' | 'safe'

interface InspectionItem {
  id: number
  title: string
  area: string
  date: string
  score: number
  note: string
  level: RiskLevel
}

interface InspectionGroup {
  id: number
  label: string
  title: string
  level: RiskLevel
  items: InspectionItem[]
}

const inspectionGroups: InspectionGroup[] = [
  {
    id: 1,
    label: '1',
    title: '存在风险',
    level: 'danger',
    items: [
      {
        id: 1,
        title: '1# 生产车间',
        area: '1# 生产车间',
        date: '2026 年 2 月 28 日',
        score: 61,
        note: '存在高风险 · 待整改 2 项',
        level: 'danger',
      },
    ],
  },
  {
    id: 2,
    label: '2',
    title: '需重点关注',
    level: 'warning',
    items: [
      {
        id: 2,
        title: '2# 成品仓库',
        area: '2# 成品仓库',
        date: '2026 年 2 月 18 日',
        score: 78,
        note: '需重点关注 · 待复检 1 项',
        level: 'warning',
      },
      {
        id: 3,
        title: '6# 动力站房',
        area: '6# 动力站房',
        date: '2026 年 2 月 17 日',
        score: 81,
        note: '待维保 1 项',
        level: 'warning',
      },
    ],
  },
  {
    id: 3,
    label: '3',
    title: '状态良好',
    level: 'safe',
    items: [
      {
        id: 4,
        title: '3# 综合厂房',
        area: '3# 综合厂房',
        date: '2026 年 2 月 22 日',
        score: 92,
        note: '状态良好',
        level: 'safe',
      },
      {
        id: 5,
        title: '4# 原料仓库',
        area: '4# 原料仓库',
        date: '2026 年 2 月 21 日',
        score: 95,
        note: '状态良好',
        level: 'safe',
      },
      {
        id: 6,
        title: '5# 办公区',
        area: '5# 办公区',
        date: '2026 年 2 月 19 日',
        score: 97,
        note: '状态良好',
        level: 'safe',
      },
    ],
  },
]

const levelStyles: Record<
  RiskLevel,
  {
    badge: string
    icon: string
    accent: string
    text: string
  }
> = {
  danger: {
    badge: 'bg-rose-500 text-white',
    icon: 'text-rose-500',
    accent: 'text-rose-500',
    text: 'text-slate-700',
  },
  warning: {
    badge: 'bg-orange-500 text-white',
    icon: 'text-orange-500',
    accent: 'text-orange-500',
    text: 'text-slate-700',
  },
  safe: {
    badge: 'bg-emerald-500 text-white',
    icon: 'text-emerald-500',
    accent: 'text-emerald-500',
    text: 'text-slate-700',
  },
}

const distributionBars = Array.from({ length: 42 }, (_, index) => ({
  id: index,
  height: 28 + ((index * 7) % 8),
}))
</script>

<template>
  <section class="mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-[#ECECEC]">
    <div
      class="relative overflow-hidden rounded-none bg-gradient-to-b from-brand-400 via-brand-300 via-40% to-[#ECECEC] px-4 pb-10 pt-4"
    >
      <div
        class="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.9)_1.2px,transparent_0)] [background-size:12px_12px]"
      />

      <div class="relative flex items-center justify-between px-2 text-[11px] font-semibold text-slate-900">
        <span>9:41</span>
        <div class="flex items-center gap-1.5">
          <span class="flex gap-0.5">
            <span class="h-1.5 w-1 rounded-full bg-slate-900" />
            <span class="h-2 w-1 rounded-full bg-slate-900" />
            <span class="h-2.5 w-1 rounded-full bg-slate-900" />
          </span>
          <span
            class="block h-2 w-3 rounded-full border border-slate-900"
            aria-hidden="true"
          >
            <span class="ml-auto mt-0.5 mr-0.5 block h-1 w-1.5 rounded-full bg-slate-900" />
          </span>
        </div>
      </div>

      <div class="relative mt-5 flex items-center justify-between">
        <button
          type="button"
          class="rounded-full border border-white/70 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/80"
          aria-label="查看全部园区"
        >
          查看全部园区
        </button>

        <button
          type="button"
          class="flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-white/15 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/80"
          aria-label="用户中心"
        >
          <span class="relative block h-8 w-8">
            <span class="absolute left-1/2 top-1 block h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white/85" />
            <span class="absolute bottom-0 left-1/2 h-[18px] w-7 -translate-x-1/2 rounded-t-full rounded-b-[10px] bg-white/75" />
          </span>
        </button>
      </div>

      <header class="relative mt-4 px-2 pb-12">
        <h1 class="text-[23px] font-extrabold leading-tight tracking-tight text-white">
          华东智能制造产业园
        </h1>
        <p class="mt-2 text-sm font-medium text-white/80">
          2026 年 2 月巡检报告 · 覆盖 6 栋建筑
        </p>
      </header>
    </div>

    <div class="relative -mt-8 px-4 pb-24">
      <section class="overflow-hidden rounded-[22px] bg-white shadow-panel">
        <div class="border-b border-slate-200 px-4 pb-4 pt-4">
          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-slate-500">本次巡检结果</p>
            </div>
            <p class="flex items-end text-slate-900">
              <span class="text-4xl font-bold leading-none">84</span>
              <span class="pb-1 text-xl font-medium text-slate-400">/100</span>
            </p>
          </div>

          <div
            class="mt-4 flex items-end gap-1 overflow-hidden rounded-xl bg-slate-50 px-2 py-3"
            aria-label="风险分布图"
          >
            <span
              v-for="bar in distributionBars"
              :key="bar.id"
              class="block w-1 flex-1 rounded-full"
              :class="
                bar.id < 14
                  ? 'bg-gradient-to-t from-rose-400 to-orange-400'
                  : bar.id < 28
                    ? 'bg-gradient-to-t from-orange-400 to-lime-400'
                    : 'bg-gradient-to-t from-lime-400 to-emerald-400'
              "
              :style="{ height: `${bar.height}px` }"
            />
          </div>
        </div>

        <div
          v-for="group in inspectionGroups"
          :key="group.id"
          class="border-b border-slate-200 last:border-b-0"
        >
          <div class="flex items-center gap-2 bg-slate-50 px-4 py-2">
            <span
              class="inline-flex min-w-6 items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold"
              :class="levelStyles[group.level].badge"
            >
              {{ group.label }}
            </span>
            <span class="text-sm font-medium text-slate-400">{{ group.title }}</span>
          </div>

          <button
            v-for="item in group.items"
            :key="item.id"
            type="button"
            class="flex w-full items-start gap-3 border-t border-dashed border-slate-200 px-4 py-4 text-left first:border-t-0 focus:outline-none focus:ring-2 focus:ring-brand-300"
            :aria-label="`查看 ${item.area} 巡检详情`"
          >
            <span class="mt-1 shrink-0" :class="levelStyles[item.level].icon" aria-hidden="true">
              <svg
                v-if="item.level === 'danger'"
                viewBox="0 0 24 24"
                class="h-5 w-5 fill-current"
              >
                <path
                  d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 14h-2v-2h2Zm0-4h-2V7h2Z"
                />
              </svg>
              <svg
                v-else-if="item.level === 'warning'"
                viewBox="0 0 24 24"
                class="h-5 w-5 fill-current"
              >
                <path
                  d="M12 3 1.8 20.5a1 1 0 0 0 .9 1.5h18.6a1 1 0 0 0 .9-1.5ZM11 9h2v5h-2Zm0 6h2v2h-2Z"
                />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                class="h-5 w-5 fill-current"
              >
                <path
                  d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1.1 14.2-4.2-4.1 1.4-1.5 2.8 2.8 5.2-5.3 1.5 1.4Z"
                />
              </svg>
            </span>

            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-1 text-[17px] font-bold text-slate-900">
                {{ item.title }}
                <span class="truncate text-xs font-medium text-slate-400">
                  最近巡检: {{ item.date }}
                </span>
              </span>

              <span class="mt-2 flex items-end gap-1">
                <span class="text-4xl font-semibold leading-none" :class="levelStyles[item.level].accent">
                  {{ item.score }}
                </span>
                <span class="pb-1 text-xl font-medium text-slate-300">/100</span>
                <span class="truncate pb-1 text-sm font-medium" :class="levelStyles[item.level].text">
                  {{ item.note }}
                </span>
              </span>
            </span>

            <span class="mt-6 shrink-0 text-slate-300" aria-hidden="true">
              <svg viewBox="0 0 20 20" class="h-4 w-4 fill-current">
                <path d="M7.7 4.2 13.5 10l-5.8 5.8-1.4-1.4L10.7 10 6.3 5.6Z" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      <nav
        class="fixed bottom-4 left-1/2 z-10 flex w-[calc(100%_-_2rem)] max-w-[398px] -translate-x-1/2 items-center justify-between rounded-full bg-white/95 px-2 py-2 shadow-dock backdrop-blur"
        aria-label="底部导航"
      >
        <button
          type="button"
          class="flex min-w-[104px] items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-300"
          aria-current="page"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current">
            <path
              d="M7 3h2v2h6V3h2v2h3v16H4V5Zm11 6H6v10h12Zm-8 3h4v4h-4Z"
            />
          </svg>
          报告
        </button>

        <button
          type="button"
          class="flex min-w-[104px] items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current">
            <path
              d="M5 4h14v4H5Zm0 6h14v10H5Zm2 2v6h10v-6Z"
            />
          </svg>
          历史
        </button>

        <button
          type="button"
          class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-900 shadow-md focus:outline-none focus:ring-2 focus:ring-brand-300"
          aria-label="搜索"
        >
          <svg viewBox="0 0 24 24" class="h-6 w-6 fill-current">
            <path
              d="M10.5 3a7.5 7.5 0 1 0 4.8 13.3l4.7 4.7 1.4-1.4-4.7-4.7A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z"
            />
          </svg>
        </button>
      </nav>
    </div>
  </section>
</template>
