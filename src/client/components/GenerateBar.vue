<template>
  <div class="generate-bar">
    <button class="btn btn-primary btn-lg" @click="$emit('generate')" :disabled="loading">
      <svg v-if="loading" class="btn-icon spinning" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" />
      </svg>
      <svg v-else class="btn-icon" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      </svg>
      <span>{{ loading ? '生成中...' : '生成一周计划' }}</span>
    </button>
    <button v-if="hasPlan" class="btn btn-ghost btn-lg" @click="$emit('regenerate-all')" :disabled="loading">
      重新生成
    </button>
  </div>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  hasPlan: { type: Boolean, default: false }
})

defineEmits(['generate', 'regenerate-all'])
</script>

<style scoped>
.generate-bar {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.btn-lg {
  padding: 14px 28px;
  font-size: 1rem;
  border-radius: var(--radius);
  min-height: 52px;
}

.btn-lg .btn-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@media (max-width: 767px) {
  .generate-bar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg);
    padding: var(--space-md) 0;
    margin: calc(-1 * var(--space-xl)) var(--space-lg) var(--space-xl);
    border-bottom: 1px solid var(--border-light);
    flex-direction: column;
  }

  .btn-lg {
    width: 100%;
    justify-content: center;
  }
}
</style>