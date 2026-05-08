<template>
  <div class="dish-card">
    <div v-if="dish.image" class="dish-card-image">
      <img :src="dish.image" :alt="dish.name" class="recipe-image" />
    </div>
    <div class="dish-card-content">
      <div class="dish-name">{{ dish.name }}</div>
      <div class="dish-desc" v-if="dish.description">{{ dish.description }}</div>
      <IngredientList :ingredients="dish.ingredients" />
    </div>
  </div>
</template>

<script setup>
import IngredientList from './IngredientList.vue'

defineProps({
  dish: { type: Object, required: true }
})
</script>

<style scoped>
.dish-card {
  display: flex;
  gap: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  transition: all var(--transition-normal);
}

.dish-card:hover {
  background: var(--card-hover);
  transform: translateX(4px);
}

.dish-card-content {
  flex: 1;
  min-width: 0;
}

.dish-card-image {
  width: 80px;
  height: 80px;
  min-width: 80px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-secondary);
}

.dish-card-image .recipe-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-name {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 2px;
  color: var(--text-primary);
}

.dish-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
  line-height: 1.4;
}

@media (max-width: 767px) {
  .dish-card {
    flex-direction: column;
    padding: var(--space-sm) var(--space-md);
  }

  .dish-card-image {
    width: 100%;
    height: auto;
    min-width: unset;
    aspect-ratio: 16 / 9;
  }

  .dish-name {
    font-size: 0.9rem;
  }
}
</style>