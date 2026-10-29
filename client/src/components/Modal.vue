<script setup>
defineProps({
  title: { type: String, default: '' },
})
const emit = defineEmits(['close'])
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-box card">
      <div class="modal-head">
        <h3>{{ title }}</h3>
        <button class="btn btn-ghost btn-icon" @click="emit('close')">
          <svg viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3 3 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 38, 32, 0.35);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal-box {
  width: 100%;
  max-width: 520px;
  max-height: 88vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: var(--shadow-lg);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.modal-head h3 {
  font-size: 18px;
}
</style>
