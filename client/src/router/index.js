import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/contatos',
      name: 'contacts',
      component: () => import('../views/ContactsListView.vue'),
    },
    {
      path: '/financas',
      name: 'finances',
      component: () => import('../views/FinancesView.vue'),
    },
    {
      path: '/contatos/novo',
      name: 'contact-new',
      component: () => import('../views/ContactFormView.vue'),
    },
    {
      path: '/contatos/:id',
      name: 'contact-profile',
      component: () => import('../views/ContactProfileView.vue'),
      props: true,
    },
    {
      path: '/contatos/:id/editar',
      name: 'contact-edit',
      component: () => import('../views/ContactFormView.vue'),
      props: true,
    },
    {
      path: '/tarefas/nova',
      name: 'task-new',
      component: () => import('../views/TaskFormView.vue'),
    },
    {
      path: '/tarefas/:id/editar',
      name: 'task-edit',
      component: () => import('../views/TaskFormView.vue'),
      props: true,
    },
  ],
})

export default router
