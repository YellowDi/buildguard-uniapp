import type { MaintenanceTaskDetail, MaintenanceTaskListData, MaintenanceTrade } from '../types/maintenance'
import mockData from '../mock/maintenance-tasks.json'
import mockDetailData from '../mock/maintenance-detail.json'

export async function fetchMaintenanceTaskList(trade: MaintenanceTrade): Promise<MaintenanceTaskListData> {
  const data = mockData as MaintenanceTaskListData
  return {
    sections: data.sections.map((section) => ({
      ...section,
      tasks: section.tasks.filter((task) => task.trade === trade),
    })),
  }
}

export async function fetchMaintenanceTaskDetail(id: number): Promise<MaintenanceTaskDetail | null> {
  const record = mockDetailData as Record<string, MaintenanceTaskDetail>
  return record[String(id)] ?? null
}
