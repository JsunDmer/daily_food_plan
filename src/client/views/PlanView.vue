<template>
  <div class="plan-view">
    <GenerateBar @generate="handleGenerate" @regenerate-all="handleRegenerateAll" :loading="loading" :has-plan="!!plan" />
    <WeeklyPlan :days="plan?.days || []" @regenerate-day="handleRegenerateDay" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import WeeklyPlan from '../components/WeeklyPlan.vue'
import GenerateBar from '../components/GenerateBar.vue'
import { generatePlan, getCurrentPlan, regenerateDay } from '../services/index.js'

const plan = ref(null)
const loading = ref(false)

onMounted(async () => {
  try {
    const res = await getCurrentPlan()
    if (res.data) plan.value = res.data
  } catch {}
})

async function handleGenerate() {
  loading.value = true
  try {
    const res = await generatePlan()
    plan.value = res.data
  } catch (err) {
    alert('生成失败：' + err.message)
  } finally {
    loading.value = false
  }
}

async function handleRegenerateAll() {
  loading.value = true
  try {
    const res = await generatePlan()
    plan.value = res.data
  } catch (err) {
    alert('重新生成失败：' + err.message)
  } finally {
    loading.value = false
  }
}

async function handleRegenerateDay(dayIndex) {
  try {
    const res = await regenerateDay(dayIndex)
    plan.value = res.data
  } catch (err) {
    alert('重新生成失败：' + err.message)
  }
}
</script>

<style scoped>
.plan-view {
  padding-bottom: 80px;
}

@media (min-width: 768px) {
  .plan-view {
    padding-bottom: var(--space-xl);
  }
}
</style>