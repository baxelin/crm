<script setup>
import { tasksApi } from '../api'

const props = defineProps({
  taskId: { type: Number, required: true },
})
const done = defineModel('done', { type: Number, default: 0 })
const emit = defineEmits(['error'])

async function toggle() {
  const previous = done.value
  done.value = previous ? 0 : 1
  try {
    await tasksApi.update(props.taskId, { done: done.value })
  } catch (e) {
    done.value = previous
    emit('error', e.message)
  }
}
</script>

<template>
  <button type="button" class="task-check" :title="done ? 'Reabrir' : 'Concluir'" @click.stop="toggle">
    <svg v-if="done" viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5 6.2 12 13 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
</template>

<style scoped>
.task-check {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1.4px solid var(--color-border);
  background: var(--color-surface-raised);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-success);
  transition: border-color 0.15s ease;
}

.task-check:hover {
  border-color: var(--color-success);
}

.task-check svg {
  width: 11px;
  height: 11px;
}
</style>
