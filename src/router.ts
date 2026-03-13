import { createRouter, createWebHistory } from 'vue-router'
import { getStoredSession, resolveHomePath, type UserRole } from './auth/session'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('./components/auth/Login.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/',
      redirect: () => {
        const session = getStoredSession()
        return session ? resolveHomePath(session.role) : '/login'
      },
    },
    {
      path: '/inspection',
      name: 'inspectionHome',
      component: () => import('./components/task/TaskList.vue'),
      meta: { title: '检修工作台', requiresRole: 'inspector' satisfies UserRole },
    },
    {
      path: '/maintenance',
      name: 'maintenanceHome',
      component: () => import('./components/maintenance/MaintenanceHome.vue'),
      meta: { title: '维修工作台', requiresRole: 'maintainer' satisfies UserRole },
    },
    {
      path: '/task/:id',
      name: 'taskDetail',
      component: () => import('./components/task/TaskDetail.vue'),
      meta: { title: '任务详情', requiresRole: 'inspector' satisfies UserRole },
    },
  ],
})

router.beforeEach((to) => {
  const session = getStoredSession()

  if (to.name === 'login') {
    return session ? resolveHomePath(session.role) : true
  }

  if (!session) return '/login'

  const requiredRole = to.meta.requiresRole as UserRole | undefined
  if (requiredRole && requiredRole !== session.role) {
    return resolveHomePath(session.role)
  }

  return true
})

// 路由切换时同步 document.title（仅当前页面标题，便于迁移到微信小程序）
router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  if (title) document.title = title
})

export default router
