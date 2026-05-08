<template>
  <div class="week-navigator">
    <button type="button" class="nav-btn nav-prev" @click="goPrevWeek" aria-label="上一周">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </button>

    <div class="week-info">
      <span class="week-range">{{ weekRangeText }}</span>
      <button
        v-if="!isCurrentWeek"
        type="button"
        class="today-btn"
        @click="goToday"
      >
        今天
      </button>
      <span v-else class="current-tag">本周</span>
    </div>

    <button type="button" class="nav-btn nav-next" @click="goNextWeek" aria-label="下一周">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatWeekRange, getPrevWeekKey, getNextWeekKey, getCurrentWeekKey } from '../services/dateUtils.js'

const props = defineProps({
  weekKey: { type: String, required: true }
})

const emit = defineEmits(['change'])

const weekRangeText = computed(() => formatWeekRange(props.weekKey))

const isCurrentWeek = computed(() => props.weekKey === getCurrentWeekKey())

function goPrevWeek() {
  emit('change', getPrevWeekKey(props.weekKey))
}

function goNextWeek() {
  emit('change', getNextWeekKey(props.weekKey))
}

function goToday() {
  emit('change', getCurrentWeekKey())
}
</script>

<style scoped>
.week-navigator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  margin-bottom: var(--space-lg);
}

.nav-btn {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-btn svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2.5;
  fill: none;
}

.nav-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-subtle);
}

.nav-btn:active {
  transform: scale(0.95);
}

.week-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  justify-content: center;
}

.week-range {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.today-btn {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--primary);
  background: var(--primary-subtle);
  color: var(--primary-dark);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.today-btn:hover {
  background: var(--primary);
  color: white;
}

.current-tag {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--success-light);
  color: var(--success);
  font-size: 0.75rem;
  font-weight: 700;
}

@media (max-width: 480px) {
  .week-navigator {
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
  }

  .nav-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
  }

  .week-range {
    font-size: 0.9rem;
  }
}
</style>