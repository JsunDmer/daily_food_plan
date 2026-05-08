<template>
  <div class="weekly-plan">
    <div v-if="days.length === 0" class="empty-state">
      <p>点击上方「生成一周计划」开始</p>
    </div>
    <div v-else class="days-grid">
      <DayPlan
        v-for="day in days"
        :key="day.dayIndex"
        :day="day"
        @regenerate="handleRegenerateDay"
      />
    </div>
  </div>
</template>

<script setup>
import DayPlan from './DayPlan.vue'

const props = defineProps({
  days: { type: Array, default: () => [] }
})

const emit = defineEmits(['regenerate-day'])

function handleRegenerateDay(dayIndex) {
  emit('regenerate-day', dayIndex)
}
</script>

<style scoped>
.weekly-plan {
  margin-top: var(--space-lg);
}

.empty-state {
  text-align: center;
  padding: 80px var(--space-lg);
  color: var(--text-secondary);
  font-size: 1rem;
}

.empty-state p {
  font-size: 1.1rem;
  color: var(--text-muted);
}

.days-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

@media (min-width: 600px) {
  .days-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .days-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1200px) {
  .days-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>