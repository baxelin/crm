<script setup>
import { computed } from 'vue'
import { whatsappLink, mapsLink, mailtoLink } from '../utils/links'

const props = defineProps({
  contact: { type: Object, required: true },
  size: { type: String, default: 'md' },
})

const whatsapp = computed(() => whatsappLink(props.contact.phone))
const maps = computed(() => mapsLink(props.contact.address))
const mail = computed(() => mailtoLink(props.contact.email))
</script>

<template>
  <div class="quick-actions" :class="size" @click.stop>
    <a v-if="whatsapp" :href="whatsapp" target="_blank" rel="noopener" class="qa-btn qa-whatsapp" title="Abrir WhatsApp">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.02 2C6.5 2 2.02 6.48 2.02 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12.02 22C17.55 22 22 17.52 22 12S17.55 2 12.02 2Zm5.62 14.13c-.24.67-1.4 1.29-1.93 1.34-.5.05-1.1.08-1.78-.11-.41-.12-.94-.3-1.62-.6-2.86-1.24-4.72-4.15-4.86-4.34-.14-.19-1.16-1.55-1.16-2.96 0-1.4.73-2.09 1-2.38.24-.27.53-.34.71-.34h.5c.16 0 .38-.02.58.46.24.58.83 2 .9 2.15.07.15.11.32.02.51-.09.19-.14.31-.28.47-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.27.71 1.21 1.53 1.97 1.05.98 1.95 1.29 2.22 1.44.27.15.43.13.59-.05.16-.18.68-.8.86-1.07.18-.27.36-.22.6-.13.24.09 1.55.75 1.82.89.27.14.44.2.51.31.07.11.07.63-.17 1.3Z"/></svg>
    </a>
    <a v-if="maps" :href="maps" target="_blank" rel="noopener" class="qa-btn qa-maps" title="Abrir no Google Maps">
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7.58 7-12.5A7 7 0 0 0 5 9.5C5 14.42 12 22 12 22Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.4" stroke="currentColor" stroke-width="1.6"/></svg>
    </a>
    <a v-if="mail" :href="mail" class="qa-btn qa-mail" title="Enviar e-mail">
      <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5.5" width="18" height="13" rx="2.4" stroke="currentColor" stroke-width="1.6"/><path d="m4 7 8 6 8-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
  </div>
</template>

<style scoped>
.quick-actions {
  display: inline-flex;
  gap: 8px;
}

.qa-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: var(--color-bg-alt);
  color: var(--color-text-muted);
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.qa-btn svg {
  width: 15px;
  height: 15px;
}

.quick-actions.lg .qa-btn {
  width: 40px;
  height: 40px;
}

.quick-actions.lg .qa-btn svg {
  width: 18px;
  height: 18px;
}

.qa-whatsapp:hover {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.qa-maps:hover {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.qa-mail:hover {
  background: var(--color-info-soft);
  color: var(--color-info);
}
</style>
