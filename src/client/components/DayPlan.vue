<template>
  <div class="day-plan">
    <div class="day-header">
      <h3 class="day-title">{{ day.day }}</h3>
      <button class="btn btn-ghost btn-sm" @click="$emit('regenerate', day.dayIndex)">
        换一批
      </button>
    </div>
    <MealSection title="早餐" :type="'breakfast'" :meals="day.breakfast" :color="'var(--breakfast-color)'" />
    <MealSection title="晚餐" :type="'dinner'" :meals="day.dinner" :color="'var(--dinner-color)'" />
    
    <!-- 每日采购清单 -->
    <div class="day-shopping">
      <div class="shopping-header">
        <span class="shopping-title">采购</span>
        <span class="shopping-count">{{ dayIngredients.length }}种</span>
      </div>
      <div class="shopping-list">
        <a 
          v-for="(ing, idx) in dayIngredients" 
          :key="idx" 
          :href="ing.dingdongUrl" 
          target="_blank" 
          rel="noopener" 
          class="shopping-item"
          :title="'在叮咚搜索 ' + ing.name"
        >
          <span class="ing-name">{{ ing.name }}</span>
          <span class="ing-amount">{{ ing.amount }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MealSection from './MealSection.vue'

const props = defineProps({
  day: { type: Object, required: true }
})

defineEmits(['regenerate'])

// 汇总当天所有食材
const dayIngredients = computed(() => {
  const list = []
  const meals = [...props.day.breakfast, ...props.day.dinner]
  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      list.push({
        name: ing.name,
        amount: ing.amount,
        dingdongUrl: ing.dingdongUrl
      })
    }
  }
  return list
})
</script>

<style scoped>
.day-plan {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: all var(--transition-normal);
}

.day-plan:hover {
  box-shadow: var(--shadow-hover);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-light);
  background: linear-gradient(135deg, var(--primary-subtle) 0%, var(--card-bg) 100%);
}

.day-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.day-header .btn-sm {
  font-size: 0.8rem;
  min-height: 36px;
}

.day-shopping {
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
}

.shopping-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.shopping-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dingdong);
  display: flex;
  align-items: center;
  gap: 4px;
}

.shopping-title::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--dingdong);
  border-radius: 50%;
}

.shopping-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.shopping-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.shopping-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 6px 12px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--text);
  text-decoration: none;
  transition: all var(--transition-fast);
  min-height: 32px;
}

.shopping-item:hover {
  border-color: var(--dingdong);
  color: var(--dingdong);
  background: var(--dingdong-light);
  transform: scale(1.02);
}

.ing-name {
  font-weight: 600;
}

.ing-amount {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.shopping-item:hover .ing-amount {
  color: var(--dingdong);
}

@media (max-width: 767px) {
  .day-header {
    padding: var(--space-md);
  }

  .day-shopping {
    padding: var(--space-md);
  }

  .shopping-item {
    font-size: 0.75rem;
    padding: 4px 10px;
  }
}
</style>