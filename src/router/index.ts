import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/layouts/AuthLayout.vue'),
      meta: { requiresGuest: true },
      children: [
        {
          path: '',
          component: () => import('@/views/auth/LoginView.vue')
        }
      ]
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/layouts/AuthLayout.vue'),
      meta: { requiresGuest: true },
      children: [
        {
          path: '',
          component: () => import('@/views/auth/RegisterView.vue')
        }
      ]
    },
    {
      path: '/methodist',
      component: () => import('@/layouts/MethodistLayout.vue'),
      meta: { requiresAuth: true, role: 'methodist' },
      children: [
        {
          path: 'dashboard',
          name: 'methodist-dashboard',
          component: () => import('@/views/methodist/DashboardView.vue')
        },
        {
          path: 'courses',
          name: 'methodist-courses',
          component: () => import('@/views/methodist/CoursesView.vue')
        },
        {
          path: 'courses/create',
          name: 'methodist-course-create',
          component: () => import('@/views/methodist/CourseCreateView.vue')
        },
        {
          path: 'courses/:id/edit',
          name: 'methodist-course-edit',
          component: () => import('@/views/methodist/CourseEditView.vue')
        },
        {
          path: 'results',
          name: 'methodist-results',
          component: () => import('@/views/methodist/ResultsView.vue')
        },
        {
          path: 'cases',
          name: 'methodist-cases',
          component: () => import('@/views/methodist/CasesView.vue')
        },
        {
          path: 'cases/create',
          name: 'methodist-case-create',
          component: () => import('@/views/methodist/CaseCreateView.vue')
        },
        {
          path: 'cases/:id/edit',
          name: 'methodist-case-edit',
          component: () => import('@/views/methodist/CaseEditView.vue')
        }
      ]
    },
    {
      path: '/student',
      component: () => import('@/layouts/StudentLayout.vue'),
      meta: { requiresAuth: true, role: 'student' },
      children: [
        {
          path: 'dashboard',
          name: 'student-dashboard',
          component: () => import('@/views/student/DashboardView.vue')
        },
        {
          path: 'courses',
          name: 'student-courses',
          component: () => import('@/views/student/CoursesView.vue')
        },
        {
          path: 'courses/:id',
          name: 'student-course-detail',
          component: () => import('@/views/student/CourseDetailView.vue')
        },
        {
          path: 'tests/:id',
          name: 'student-test',
          component: () => import('@/views/student/TestView.vue')
        },
        {
          path: 'tests/:id/result',
          name: 'student-test-result',
          component: () => import('@/views/student/TestResultView.vue')
        },
        {
          path: 'cases',
          name: 'student-cases',
          component: () => import('@/views/student/CasesView.vue')
        },
        {
          path: 'cases/:id',
          name: 'student-case-detail',
          component: () => import('@/views/student/CaseDetailView.vue')
        }
      ]
    }
  ]
})

// Navigation Guards
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // Проверка авторизации
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // Проверка для гостей (уже авторизованные не должны видеть login/register)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    const targetPath = authStore.user?.role === 'methodist'
      ? '/methodist/dashboard'
      : '/student/dashboard'

    // Предотвращаем бесконечную редиректу
    if (to.path === targetPath) {
      return next()
    }

    return next(targetPath)
  }

  // Проверка роли (только если пользователь загружен)
  if (to.meta.role && authStore.user) {
    if (authStore.user.role !== to.meta.role) {
      const targetPath = authStore.user.role === 'methodist'
        ? '/methodist/dashboard'
        : '/student/dashboard'

      // Предотвращаем бесконечную редиректу
      if (to.path === targetPath) {
        return next()
      }

      return next(targetPath)
    }
  }

  next()
})

export default router
