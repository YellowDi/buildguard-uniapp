import type { TaskStatus } from './task'

export type MaintenanceTrade = 'electric' | 'plumbing'
export type MaintenancePriority = 'high' | 'medium' | 'low'

export interface MaintenanceTask {
  id: number
  parkName: string
  taskName: string
  buildingName: string
  address?: string
  latitude?: number
  longitude?: number
  location: string
  sourceInspectionTask: string
  sourceFinding: string
  assignee: string
  trade: MaintenanceTrade
  priority: MaintenancePriority
  deadline?: string
  plannedAt?: string
  completedAt?: string
  status: TaskStatus
}

export interface MaintenanceTaskSection {
  key: string
  title?: string
  tasks: MaintenanceTask[]
}

export interface MaintenanceTaskListData {
  sections: MaintenanceTaskSection[]
}

export type MaintenanceStepStatus = 'done' | 'active' | 'pending'

export interface MaintenanceStep {
  id: number
  title: string
  description: string
  status: MaintenanceStepStatus
}

export interface MaintenanceTaskDetail extends MaintenanceTask {
  contact?: string
  phone?: string
  issueCategory: string
  riskLevelLabel: string
  dispatchReason: string
  sourceInspectionItem: string
  sourceStatusLabel: string
  sourceDescription: string
  sourceImpact: string
  sourceRemark?: string
  sourcePhotos?: string[]
  workOrderNo: string
  requiredTools: string[]
  requiredMaterials: string[]
  safetyNotes: string[]
  steps: MaintenanceStep[]
  beforeMedia?: string[]
  afterMedia?: string[]
  executionNote?: string
  completionSummary?: string
}
