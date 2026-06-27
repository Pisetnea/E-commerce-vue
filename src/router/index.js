import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'
import ProfileView from '../views/ProfileView.vue'
import RegisterView from '../views/RegisterView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: ProductDetailView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { guestOnly: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return '/'
  }

  return true
})

export default router
