<template>
  <div class="ingredient-list">
    <span v-for="ing in ingredients" :key="ing.name" class="ingredient-item">
      <a :href="ing.dingdongUrl" target="_blank" rel="noopener" class="ingredient-link" :title="'在叮咚买菜搜索 ' + ing.name">
        {{ ing.name }}<span v-if="ing.amount" class="amount">{{ ing.amount }}</span>
      </a>
    </span>
  </div>
</template>

<script setup>
defineProps({
  ingredients: { type: Array, default: () => [] }
})
</script>

<style scoped>
.ingredient-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.ingredient-item {
  display: inline;
}

.ingredient-link {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.75rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  color: var(--text);
  text-decoration: none;
  transition: all var(--transition-fast);
  min-height: 28px;
}

.ingredient-link:hover {
  border-color: var(--dingdong);
  color: var(--dingdong);
  background: var(--dingdong-light);
  transform: scale(1.05);
}

.amount {
  color: var(--text-secondary);
  margin-left: 4px;
  font-size: 0.7rem;
}
</style>