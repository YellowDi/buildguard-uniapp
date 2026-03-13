import type { MaintenanceTrade } from '../types/maintenance'
import { getStorageString, removeStorage, setStorageString } from '@/services/platform/storage'

export type UserRole = 'inspector' | 'maintainer'

export type DemoUser = {
  id: string
  username: string
  password: string
  displayName: string
  avatarUrl: string
  role: UserRole
  demoMode?: 'default' | 'empty'
  specialty?: MaintenanceTrade
  specialtyLabel?: string
  roleLabel: string
  description: string
}

export type AuthSession = {
  id: string
  displayName: string
  avatarUrl: string
  role: UserRole
  demoMode: 'default' | 'empty'
  specialty?: MaintenanceTrade
  specialtyLabel?: string
}

const USER_STORAGE_KEY = 'buildguard-user'
const USER_ID_STORAGE_KEY = 'buildguard-user-id'
const ROLE_STORAGE_KEY = 'buildguard-role'

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'inspector-demo',
    username: 'inspect_demo',
    password: '123456',
    displayName: '张检修',
    avatarUrl: '/static/avatar-inspector-default.png',
    role: 'inspector',
    demoMode: 'default',
    roleLabel: '检修身份',
    description: '查看现有巡检任务、详情数据与当前流程。',
  },
  {
    id: 'inspector-empty-demo',
    username: 'inspect_empty',
    password: '123456',
    displayName: '周检修',
    avatarUrl: '/static/avatar-inspector-empty.png',
    role: 'inspector',
    demoMode: 'empty',
    roleLabel: '检修空状态',
    description: '进入检修工作台空状态，用于演示无任务时的页面样式。',
  },
  {
    id: 'maintainer-demo',
    username: 'repair_demo',
    password: '123456',
    displayName: '李电工',
    avatarUrl: '/static/avatar-maintainer-default.png',
    role: 'maintainer',
    demoMode: 'default',
    specialty: 'electric',
    specialtyLabel: '电工',
    roleLabel: '维修身份',
    description: '查看电气类维修工单，来源于检修异常后的派单任务。',
  },
  {
    id: 'maintainer-plumbing-demo',
    username: 'repair_plumbing',
    password: '123456',
    displayName: '孙水工',
    avatarUrl: '/static/avatar-maintainer-empty.png',
    role: 'maintainer',
    demoMode: 'default',
    specialty: 'plumbing',
    specialtyLabel: '水工',
    roleLabel: '维修身份',
    description: '查看给排水类维修工单，来源于检修异常后的派单任务。',
  },
]

function isUserRole(value: string | null): value is UserRole {
  return value === 'inspector' || value === 'maintainer'
}

export function authenticateDemoUser(username: string, password: string): DemoUser | null {
  const normalizedUsername = username.trim()
  const user = DEMO_USERS.find(
    (item) => item.username === normalizedUsername && item.password === password,
  )
  return user ?? null
}

export function saveSession(user: DemoUser) {
  setStorageString(USER_STORAGE_KEY, user.displayName)
  setStorageString(USER_ID_STORAGE_KEY, user.id)
  setStorageString(ROLE_STORAGE_KEY, user.role)
}

export function clearSession() {
  removeStorage(USER_STORAGE_KEY)
  removeStorage(USER_ID_STORAGE_KEY)
  removeStorage(ROLE_STORAGE_KEY)
}

export function getStoredSession(): AuthSession | null {
  const displayName = getStorageString(USER_STORAGE_KEY)
  if (!displayName) return null

  const storedId = getStorageString(USER_ID_STORAGE_KEY) || 'legacy-user'
  const storedRole = getStorageString(ROLE_STORAGE_KEY)
  const role: UserRole = isUserRole(storedRole) ? storedRole : 'inspector'
  const matchedUser = DEMO_USERS.find((item) => item.id === storedId)

  return {
    id: storedId,
    displayName: matchedUser?.displayName || displayName,
    avatarUrl: matchedUser?.avatarUrl || '',
    role,
    demoMode: matchedUser?.demoMode || 'default',
    specialty: matchedUser?.specialty,
    specialtyLabel: matchedUser?.specialtyLabel,
  }
}

export function resolveHomePath(role: UserRole) {
  return role === 'maintainer' ? '/pages/maintenance/index' : '/pages/inspection/index'
}
