import type { MaintenanceTaskDetail, MaintenanceTaskListData, MaintenanceTrade } from '../types/maintenance'
import mockData from '../mock/maintenance-tasks.json'
import mockDetailData from '../mock/maintenance-detail.json'
import { resolveCoordinate } from '../utils/geo'

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
  const raw = record[String(id)] ?? null
  if (!raw) return null
  const coordinate = resolveCoordinate(raw.address)
  return {
    ...raw,
    latitude: coordinate?.latitude,
    longitude: coordinate?.longitude,
  }
}
