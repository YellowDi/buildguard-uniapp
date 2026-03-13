import type { MaintenanceTask, MaintenanceTaskDetail, MaintenanceTaskListData, MaintenanceTrade } from '../types/maintenance'
import mockData from '../mock/maintenance-tasks.json'
import mockDetailData from '../mock/maintenance-detail.json'
import { resolveCoordinate } from '../utils/geo'

function buildMockMaintenanceDetail(task: MaintenanceTask): MaintenanceTaskDetail {
  const address = task.address || '浙江省宁波市鄞州区菁华路188号'
  const issueCategory = task.trade === 'electric' ? '电气维修' : '给排水维修'
  const tools =
    task.trade === 'electric'
      ? ['绝缘螺丝刀', '万用表', '测温仪']
      : ['活动扳手', '检漏纸', '手电']
  const materials =
    task.trade === 'electric'
      ? ['接线端子', '绝缘胶带', '备用模块']
      : ['密封件', '生料带', 'PVC接头']
  const safetyNotes =
    task.trade === 'electric'
      ? ['检修前确认支路停电并挂牌', '复电前完成接线复核和绝缘检查']
      : ['施工前关闭对应阀门并释放余压', '恢复供水后复查接口和周边无渗漏']

  return {
    ...task,
    address,
    issueCategory,
    riskLevelLabel: task.priority === 'high' ? '优先处理' : task.priority === 'medium' ? '常规处理' : '低风险处理',
    dispatchReason: `${task.sourceInspectionTask} 中发现“${task.sourceFinding}”，已生成维修工单。`,
    sourceInspectionItem: task.taskName,
    sourceStatusLabel: task.priority === 'high' ? '存在风险' : '需重点关注',
    sourceDescription: task.sourceFinding,
    sourceImpact: task.trade === 'electric' ? '可能影响相关设备供电稳定性和运行安全。' : '可能影响现场排水、给水或环境卫生状态。',
    sourceRemark: '该记录由 mock 数据自动补全，用于页面样式和交互测试。',
    sourcePhotos: [
      `https://picsum.photos/seed/buildguard-maint-${task.id}-a/480/320`,
      `https://picsum.photos/seed/buildguard-maint-${task.id}-b/480/320`,
    ],
    workOrderNo: `WX-${String(task.id).padStart(8, '0')}`,
    requiredTools: tools,
    requiredMaterials: materials,
    safetyNotes,
    contact: task.assignee,
    phone: '13800001234',
    beforeMedia: [`https://picsum.photos/seed/buildguard-maint-${task.id}-a/480/320`],
    afterMedia: task.status === 'completed' ? [`https://picsum.photos/seed/buildguard-maint-${task.id}-b/480/320`] : undefined,
    executionNote: task.status === 'completed' ? '已完成现场处理和复核，设备/点位状态恢复正常。' : undefined,
    completionSummary: task.status === 'completed' ? '该维修任务已完成，可用于详情页演示和样式验收。' : undefined,
    steps: [
      { id: 1, title: '到场复核', description: '确认问题点位、范围和施工条件。', status: task.status === 'pending' ? 'pending' : 'done' },
      { id: 2, title: '现场处理', description: '完成对应维修作业并记录影像。', status: task.status === 'active' ? 'active' : task.status === 'completed' ? 'done' : 'pending' },
      { id: 3, title: '复查确认', description: '复测结果并恢复现场状态。', status: task.status === 'completed' ? 'done' : 'pending' },
    ],
  }
}

export async function fetchMaintenanceTaskList(trade: MaintenanceTrade): Promise<MaintenanceTaskListData> {
  const data = mockData as MaintenanceTaskListData
  return {
    sections: data.sections.map((section) => ({
      ...section,
      tasks: section.tasks
        .filter((task) => task.trade === trade)
        .map((task) => {
          const coordinate = resolveCoordinate(task.address)
          return {
            ...task,
            latitude: coordinate?.latitude,
            longitude: coordinate?.longitude,
          }
        }),
    })),
  }
}

export async function fetchMaintenanceTaskDetail(id: number): Promise<MaintenanceTaskDetail | null> {
  const record = mockDetailData as Record<string, MaintenanceTaskDetail>
  const fallbackTask =
    ((mockData as MaintenanceTaskListData).sections
      .flatMap((section) => section.tasks)
      .find((task) => task.id === id) as MaintenanceTask | undefined) ?? null
  const raw = record[String(id)] ?? (fallbackTask ? buildMockMaintenanceDetail(fallbackTask) : null)
  if (!raw) return null
  const coordinate = resolveCoordinate(raw.address)
  return {
    ...raw,
    latitude: coordinate?.latitude,
    longitude: coordinate?.longitude,
  }
}
