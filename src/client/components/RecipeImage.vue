<template>
  <div class="recipe-image-component" :class="{ 'has-src': src }">
    <div v-if="!src || imageFailed" class="recipe-image-placeholder" @click="handleClick">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M12 6v12M6 12h12" />
      </svg>
    </div>
    <img
      v-else
      :src="src"
      :alt="alt"
      :loading="loading"
      class="recipe-image"
      @error="handleError"
      @load="handleLoad"
    />
    <div v-if="loading && src && !imageFailed" class="recipe-image-loading">
      <div class="loading-skeleton"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  loading: { type: String, default: 'lazy' }
})

const emit = defineEmits(['error', 'load'])

const imageFailed = ref(false)
const isLoading = ref(false)

function handleError() {
  imageFailed.value = true
  emit('error', new Error('Image failed to load'))
}

function handleLoad() {
  isLoading.value = false
  emit('load')
}

function handleClick() {
}

watch(() => props.src, (newSrc) => {
  if (newSrc) {
    imageFailed.value = false
    isLoading.value = true
  }
}, { immediate: true })
</script>

<style scoped>
.recipe-image-component {
  position: relative;
  width: 100%;
  height: 100%;
}

.recipe-image-component .recipe-image-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, var(--primary-subtle), var(--bg-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
}

.recipe-image-component .recipe-image-placeholder svg {
  width: 40%;
  height: 40%;
  opacity: 0.3;
  color: var(--text-muted);
}

.recipe-image-component .recipe-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius);
}

.recipe-image-loading {
  position: absolute;
  inset: 0;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  overflow: hidden;
}

.loading-skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--border-light) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>