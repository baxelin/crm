<script setup>
defineProps({
  options: { type: Array, required: true },
})
const selected = defineModel({ type: String, default: '' })
</script>

<template>
  <div class="filter-tabs">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="filter-tab"
      :class="{ active: selected === option.value }"
      @click="selected = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  gap: 4px;
  background: var(--color-bg-alt);
  padding: 4px;
  border-radius: var(--radius-sm);
}

.filter-tab {
  border: none;
  background: transparent;
  padding: 7px 14px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  transition: all 0.15s ease;
}

.filter-tab.active {
  background: var(--color-surface-raised);
  color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}
</style>
