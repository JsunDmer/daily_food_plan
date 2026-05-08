<template>
  <div class="app">
    <nav class="nav-bar">
      <div class="nav-brand">每周饮食计划</div>
      <div class="nav-links">
        <router-link to="/" class="nav-link">本周计划</router-link>
        <router-link to="/recipes" class="nav-link">菜谱库</router-link>
      </div>
    </nav>
    <nav class="mobile-nav">
      <router-link to="/" class="mobile-nav-link" :class="{ active: $route.path === '/' }">
        <svg class="mobile-nav-icon" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="4" rx="1" />
          <rect x="3" y="10" width="18" height="4" rx="1" />
          <rect x="3" y="16" width="18" height="4" rx="1" />
        </svg>
        <span>本周计划</span>
      </router-link>
      <router-link to="/recipes" class="mobile-nav-link" :class="{ active: $route.path === '/recipes' }">
        <svg class="mobile-nav-icon" viewBox="0 0 24 24">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span>菜谱库</span>
      </router-link>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
const $route = useRoute()
</script>
