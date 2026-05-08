import { createRouter, createWebHistory } from 'vue-router'
import PlanView from '../views/PlanView.vue'
import RecipesView from '../views/RecipesView.vue'

const routes = [
  { path: '/', name: 'plan', component: PlanView },
  { path: '/recipes', name: 'recipes', component: RecipesView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
