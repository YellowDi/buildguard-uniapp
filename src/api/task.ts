import type { TaskListData } from '../types/task'
import mockData from '../mock/tasks.json'

/**
 * 获取任务列表数据
 * TODO: 替换为真实接口调用，如 `fetch('/api/tasks').then(r => r.json())`
 */
export async function fetchTaskList(): Promise<TaskListData> {
  return mockData as TaskListData
}
