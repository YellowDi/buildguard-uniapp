export function formatCompletedAt(completedAt: string): string {
  const [y, m, d] = completedAt.split('-').map(Number)
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return completedAt
  return `${y} 年 ${m} 月 ${d} 日`
}

export function parseMonthDay(value: string): Date | null {
  const match = value.match(/(\d+)\s*月\s*(\d+)\s*日/)
  if (!match) return null
  const year = new Date().getFullYear()
  return new Date(year, Number(match[1]) - 1, Number(match[2]))
}

export function parseTaskDate(value: string): Date | null {
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  }
  return parseMonthDay(value)
}

export function daysFromToday(target: Date | null): number | null {
  if (!target) return null
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  return Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

