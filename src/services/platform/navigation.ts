const pageMap = {
  login: '/pages/login/index',
  inspection: '/pages/inspection/index',
  maintenance: '/pages/maintenance/index',
  taskDetail: '/pages/task-detail/index',
  maintenanceDetail: '/pages/maintenance-detail/index',
} as const

export function goToPage(url: string, replace = false) {
  if (replace) {
    uni.reLaunch({ url })
    return
  }
  uni.navigateTo({ url })
}

export function goLogin() {
  goToPage(pageMap.login, true)
}

export function goInspectionHome(replace = true) {
  goToPage(pageMap.inspection, replace)
}

export function goMaintenanceHome(replace = true) {
  goToPage(pageMap.maintenance, replace)
}

export function goTaskDetail(id: number) {
  goToPage(`${pageMap.taskDetail}?id=${id}`)
}

export function goMaintenanceDetail(id: number) {
  goToPage(`${pageMap.maintenanceDetail}?id=${id}`)
}

