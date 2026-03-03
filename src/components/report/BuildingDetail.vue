<script setup lang="ts">
type ScoreLevel = 'success' | 'warning'

interface KeyIssue {
  id: number
  category: string
  description: string
}

interface InspectionCategory {
  id: number
  title: string
  subtitle: string
  score: number
  level: ScoreLevel
}

const buildingName = '1# 生产车间'
const parkName = '华东智能制造产业园'
const overallScore = 84
const scoreLabel = '需重点关注'

const keyIssues: KeyIssue[] = [
  { id: 1, category: '屋面工程', description: '屋面防水层局部老化，存在渗漏风险' },
  { id: 2, category: '外立面工程', description: '配电箱温升偏高，建议复检线路负载' },
  { id: 3, category: '机电系统', description: '外立面饰面空鼓，存在脱落隐患' },
]

const inspectionCategories: InspectionCategory[] = [
  { id: 1, title: '结构安全', subtitle: '中风险 · 2 项问题', score: 78, level: 'warning' },
  { id: 2, title: '消防系统', subtitle: '状态良好', score: 92, level: 'success' },
  { id: 3, title: '机电系统', subtitle: '中风险 · 1 项问题', score: 81, level: 'success' },
  { id: 4, title: '屋面工程', subtitle: '未发现渗漏', score: 88, level: 'success' },
  { id: 5, title: '外立面工程', subtitle: '中风险 · 2 项问题', score: 74, level: 'warning' },
  { id: 6, title: '给排水系统', subtitle: '状态良好', score: 90, level: 'success' },
]

const levelConfig: Record<ScoreLevel, { color: string; iconColor: string }> = {
  success: { color: 'text-[#1FC16B]', iconColor: '#1FC16B' },
  warning: { color: 'text-[#FA7319]', iconColor: '#FA7319' },
}

const totalBars = 51
const indicatorIndex = 35

function lerpColor(t: number): string {
  const stops = [
    { t: 0, r: 0xff, g: 0x45, b: 0x3a },
    { t: 0.5, r: 0xff, g: 0x9f, b: 0x0a },
    { t: 1, r: 0x30, g: 0xd1, b: 0x58 },
  ]
  let i = 0
  while (i < stops.length - 2 && stops[i + 1].t < t) i++
  const a = stops[i]
  const b = stops[i + 1]
  const local = a.t === b.t ? 0 : (t - a.t) / (b.t - a.t)
  const r = Math.round(a.r + (b.r - a.r) * local)
  const g = Math.round(a.g + (b.g - a.g) * local)
  const bl = Math.round(a.b + (b.b - a.b) * local)
  return `rgb(${r}, ${g}, ${bl})`
}
</script>

<template>
  <section class="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[#ECECEC]">
    <!-- 头部容器: linear-gradient(180deg, #C2F5DA 0%, #FFFFFF 68%), border-radius: 0 0 38px 38px -->
    <div
      class="relative flex shrink-0 flex-col items-center"
      style="
        background: linear-gradient(180deg, #C2F5DA 0%, #FFFFFF 68%);
        border-radius: 0 0 38px 38px;
        box-shadow: 0px 1px 2px 0px rgba(10, 13, 20, 0.03);
        padding: 0 24px 24px;
      "
    >
      <!-- 工具栏: h=54, gap=10, padding=0 16px 10px -->
      <div class="flex w-full items-center gap-2.5 px-4 pb-2.5 pt-4">
        <!-- 返回按钮: 44x44, rounded-full, glass -->
        <button
          type="button"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm"
          aria-label="返回"
        >
          <!-- arrow-left-line 24x24 -->
          <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none">
            <path
              fill="#171717"
              d="M7.445 13.1 7.445 13.1 18.4 13.1V11.3H7.445l4.828-4.828L11 5 4 12l7 7 1.273-1.273z"
            />
          </svg>
        </button>

        <!-- 标题区域 -->
        <div class="flex min-w-0 flex-1 flex-col justify-center gap-0.5 pl-0.5 pt-px">
          <!-- Title: SF Pro 15px Semibold, text/main-950 #171717 -->
          <h1 class="truncate text-[15px] font-semibold leading-[18px] text-[#171717]">
            {{ buildingName }}
          </h1>
          <!-- Subtitle: SF Pro 12px Medium, text/sub-600 #5C5C5C -->
          <p class="truncate text-xs font-medium leading-[14px] text-[#5C5C5C]">
            {{ parkName }}
          </p>
        </div>

        <!-- 更多按钮: 44x44 -->
        <button
          type="button"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm"
          aria-label="更多"
        >
          <!-- more-line 24x24 -->
          <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none">
            <path
              fill="#171717"
              d="M5.35 10.65a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Zm13.5 0a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Zm-6.75 0a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Z"
            />
          </svg>
        </button>
      </div>

      <!-- 分数区域: pt=32, gap=16 -->
      <div class="flex w-full flex-col gap-4 pt-8">
        <!-- 文字区域: gap=6 -->
        <div class="flex flex-col gap-1.5">
          <!-- 大分数: baseline alignment -->
          <div class="flex items-baseline">
            <!-- 84: Title/H1 56px Bold, text/main-950 #171717 -->
            <span class="text-[56px] font-bold leading-[64px] tracking-tight text-[#171717]">
              {{ overallScore }}
            </span>
            <!-- / 100: Inter Display 16px Medium, text/soft-400 #A3A3A3 -->
            <span class="text-base font-medium leading-6 text-[#A3A3A3]">/ 100</span>
          </div>
          <!-- 需重点关注: Label/Large 18px Medium, state/warning/base #FA7319 -->
          <span class="text-lg font-medium leading-6 text-[#FA7319]">{{ scoreLabel }}</span>
        </div>

        <!-- 进度条: 354w x 35h, gradient bars with alpha mask effect -->
        <div class="flex h-[35px] items-center justify-between gap-[2px]">
          <span
            v-for="i in totalBars"
            :key="i"
            class="shrink-0"
            :class="i - 1 === indicatorIndex ? 'h-[35px] w-2 rounded-[2px]' : 'h-[30px] w-1 rounded-full'"
            :style="{
              background: lerpColor((i - 1) / (totalBars - 1)),
              boxShadow: `inset 0px -0.5px 1px 0px rgba(255, 255, 255, 0.3),
                          inset 0px -0.5px 1px 0px rgba(255, 255, 255, 0.25),
                          inset 1px 1.5px 4px 0px rgba(0, 0, 0, 0.08),
                          inset 1px 1.5px 4px 0px rgba(0, 0, 0, 0.1)`,
            }"
          />
        </div>
      </div>
    </div>

    <!-- 内容容器: flex-col, gap=16, padding=16, flex-grow -->
    <div class="flex flex-1 flex-col gap-4 p-4 pb-28">
      <!-- 重点问题 标题: Prominent/Medium 16px Bold, text/main-950 #171717 -->
      <h2 class="text-base font-bold leading-6 text-[#171717]">重点问题</h2>

      <!-- 重点问题容器: gap=16 -->
      <div class="flex flex-col gap-4">
        <button
          v-for="issue in keyIssues"
          :key="issue.id"
          type="button"
          class="flex w-full items-center gap-1 text-left focus:outline-none"
          :aria-label="`查看 ${issue.description}`"
        >
          <!-- 序号 badge: 20x20, rounded-4, bg=state/faded/lighter rgba(0,0,0,0.05) -->
          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-medium leading-4 text-[#7B7B7B]"
            style="background: rgba(0, 0, 0, 0.05)"
          >
            {{ issue.id }}
          </span>

          <!-- 分类标签 badge: bg=state/faded/light rgba(0,0,0,0.1), text/faded/dark #262626 -->
          <span
            class="shrink-0 rounded-sm px-1.5 py-0.5 text-xs font-medium leading-4 text-[#262626]"
            style="background: rgba(0, 0, 0, 0.1)"
          >
            {{ issue.category }}
          </span>

          <!-- 描述: Label/Small 14px Medium, text/main-950 #171717 -->
          <span class="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-[#171717]">
            {{ issue.description }}
          </span>

          <!-- arrow-right-s-line: icon/sub-600 #5C5C5C -->
          <svg viewBox="0 0 20 20" class="h-5 w-5 shrink-0 text-[#5C5C5C]">
            <path
              fill="currentColor"
              d="m11.535 10.728-4.455 4.455L5.807 13.91l4.455-4.455L5.807 5.001l1.273-1.273z"
            />
          </svg>
        </button>
      </div>

      <!-- 检测分类 标题 -->
      <h2 class="text-base font-bold leading-6 text-[#171717]">检测分类</h2>

      <!-- 巡检体系: gap=16 -->
      <div class="flex flex-col gap-4">
        <button
          v-for="cat in inspectionCategories"
          :key="cat.id"
          type="button"
          class="flex w-full items-center gap-2 rounded-xl bg-[#F7F7F7] p-4 text-left focus:outline-none"
          style="box-shadow: 0px 1px 2px 0px rgba(10, 13, 20, 0.03)"
          :aria-label="`查看 ${cat.title} 详情`"
        >
          <!-- 标题区域: flex-1, gap=4 -->
          <div class="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <!-- title: Label/Small 14px Medium, text/main-950 #171717 -->
            <span class="text-sm font-medium leading-5 text-[#171717]">{{ cat.title }}</span>
            <!-- subtitle: Label/X-Small 12px Medium, text/sub-600 #5C5C5C -->
            <span class="text-xs font-medium leading-4 text-[#5C5C5C]">{{ cat.subtitle }}</span>
          </div>

          <!-- 分数区域: justify-end, align-center -->
          <div class="flex shrink-0 items-center">
            <!-- success icon: select-box-circle-fill, state/success/base #1FC16B -->
            <svg v-if="cat.level === 'success'" viewBox="0 0 20 20" class="mr-0.5 h-5 w-5">
              <path
                :fill="levelConfig.success.iconColor"
                d="M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10Zm-.897-6 6.363-6.364-1.273-1.272-5.09 5.091-2.546-2.546-1.272 1.273L9.103 14Z"
              />
            </svg>
            <!-- warning icon: alert-fill, state/warning/base #FA7319 -->
            <svg v-else viewBox="0 0 20 20" class="mr-0.5 h-5 w-5">
              <path
                :fill="levelConfig.warning.iconColor"
                d="m10.74.432 8.146 14.27A.49.49 0 0 1 18.145 16H.855a.49.49 0 0 1-.74-.85L8.26.432a.856.856 0 0 1 1.481 0ZM9.5 12.67c-.58 0-1.05.47-1.05 1.05s.47 1.05 1.05 1.05 1.05-.47 1.05-1.05-.47-1.05-1.05-1.05ZM8.5 6.5v5h2v-5h-2Z"
              />
            </svg>
            <!-- score: Prominent/Large 18px Bold -->
            <span class="text-lg font-bold leading-6" :class="levelConfig[cat.level].color">
              {{ cat.score }}
            </span>
            <!-- /100: Label/X-Small 12px Medium, text/soft-400 #A3A3A3 -->
            <span class="text-xs font-medium leading-4 text-[#A3A3A3]">/100</span>
          </div>

          <!-- arrow-right-s-line: icon/soft-400 #A3A3A3 -->
          <svg viewBox="0 0 20 20" class="h-5 w-5 shrink-0 text-[#A3A3A3]">
            <path
              fill="currentColor"
              d="m11.535 10.728-4.455 4.455L5.807 13.91l4.455-4.455L5.807 5.001l1.273-1.273z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Tab Bar: fixed bottom, glass morphism -->
    <nav
      class="fixed bottom-0 left-1/2 z-10 flex w-full max-w-[430px] -translate-x-1/2 items-center justify-between px-[25px] pb-[25px] pt-4"
      aria-label="底部导航"
    >
      <!-- Tab Bar Buttons: 两个 tab 共享一个 pill 背景 -->
      <div class="relative flex items-center">
        <!-- Pill 背景: glass effect -->
        <div
          class="absolute -inset-1 rounded-full"
          style="
            background: rgba(247, 247, 247, 0.85);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          "
        />

        <!-- Tab 1: 报告 (active) -->
        <button
          type="button"
          class="relative z-10 flex min-w-[102px] flex-col items-center justify-center gap-px rounded-full bg-[#EDEDED] px-2 py-1.5 focus:outline-none"
          aria-current="page"
        >
          <!-- survey-fill icon -->
          <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none">
            <path
              fill="#171717"
              d="M6.7 4.8v3.6h10.8V4.8h1.806c.494 0 .894.4.894.894v14.412a.894.894 0 0 1-.894.894H4.894A.894.894 0 0 1 4 20.106V5.694c0-.494.4-.894.894-.894H6.7ZM9.4 16.5H7.6v1.8h1.8v-1.8Zm0-3.6H7.6v1.8h1.8v-1.8Zm0-3.6H7.6v1.8h1.8v-1.8ZM15.7 3h-7.2v3.6h7.2V3Z"
            />
          </svg>
          <!-- Label/X-Small 12px Medium, text/main-950 #171717 -->
          <span class="text-xs font-medium leading-4 text-[#171717]">报告</span>
        </button>

        <!-- Tab 2: 历史 -->
        <button
          type="button"
          class="relative z-10 flex min-w-[102px] flex-col items-center justify-center gap-px rounded-full px-2 py-1.5 focus:outline-none"
        >
          <!-- archive-line icon -->
          <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none">
            <path
              fill="#A3A3A3"
              d="M3.9 9.3H3V3.903C3 3.404 3.41 3 3.893 3h17.214c.118 0 .235.023.344.068a.894.894 0 0 1 .55.835V9.3h-.9v9.001a.9.9 0 0 1-.9.9H4.8a.9.9 0 0 1-.9-.9V9.3Zm1.8 0v7.2h12.6V9.3H5.7ZM3.9 4.8v2.7h16.2V4.8H3.9Zm5.4 6.3h5.4v1.8h-5.4v-1.8Z"
            />
          </svg>
          <!-- Paragraph/X-Small 12px Regular, text/soft-400 #A3A3A3 -->
          <span class="text-xs leading-4 text-[#A3A3A3]">历史</span>
        </button>
      </div>

      <!-- 搜索按钮 -->
      <div class="relative">
        <div
          class="absolute -inset-1 rounded-full"
          style="
            background: rgba(247, 247, 247, 0.85);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          "
        />
        <button
          type="button"
          class="relative z-10 flex h-[54px] w-[54px] items-center justify-center rounded-full focus:outline-none"
          aria-label="搜索"
        >
          <!-- search-line icon -->
          <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none">
            <path
              fill="#171717"
              d="M17.428 16.155 21.283 20.01 20.01 21.283 16.155 17.428A8.1 8.1 0 1 1 17.428 16.155ZM15.623 15.488a6.3 6.3 0 1 0-.135.135l.135-.135Z"
            />
          </svg>
        </button>
      </div>
    </nav>
  </section>
</template>
