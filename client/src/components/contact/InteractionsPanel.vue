<script setup>
import { ref, onMounted } from 'vue'
import { interactionsApi } from '../../api'
import { useRequest } from '../../composables/useRequest'
import { formatDate, todayISO } from '../../utils/format'

const props = defineProps({
  contactId: { type: [String, Number], required: true },
})
const emit = defineEmits(['changed'])

const interactions = ref([])
const showForm = ref(false)
const form = ref(emptyForm())

const { loading, error, run } = useRequest(true)
const { loading: saving, error: saveError, run: save } = useRequest()

function emptyForm() {
  return { date: todayISO(), note: '' }
}

async function load() {
  await run(async () => {
    interactions.value = await interactionsApi.listForContact(props.contactId)
  })
}

async function afterChange() {
  await load()
  emit('changed')
}

async function submit() {
  if (!form.value.note.trim()) return
  const ok = await save(() => interactionsApi.create(props.contactId, form.value))
  if (!ok) return
  form.value = emptyForm()
  showForm.value = false
  await afterChange()
}

async function remove(id) {
  if (await save(() => interactionsApi.remove(id))) await afterChange()
}

onMounted(load)
</script>

<template>
  <section class="card panel">
    <div class="panel-head">
      <h3>Interações</h3>
      <button class="btn btn-secondary btn-sm" @click="showForm = !showForm">
        {{ showForm ? 'Cancelar' : '+ Adicionar' }}
      </button>
    </div>

    <form v-if="showForm" class="inline-form" @submit.prevent="submit">
      <input v-model="form.date" type="date" />
      <textarea v-model="form.note" placeholder="O que foi conversado ou feito..." required></textarea>
      <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">Salvar</button>
    </form>

    <p v-if="error || saveError" class="error-text">{{ error || saveError }}</p>
    <div v-if="loading" class="empty-state">Carregando...</div>
    <div v-else-if="!interactions.length" class="empty-state">Nenhuma interação registrada ainda.</div>

    <ul v-else class="timeline">
      <li v-for="interaction in interactions" :key="interaction.id" class="timeline-item">
        <span class="timeline-date">{{ formatDate(interaction.date) }}</span>
        <p class="timeline-note">{{ interaction.note }}</p>
        <button class="timeline-remove" title="Remover" @click="remove(interaction.id)">×</button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-item {
  position: relative;
  padding: 10px 28px 10px 14px;
  border-left: 2px solid var(--color-border-soft);
  transition: background 0.15s ease;
}

.timeline-item:hover {
  background: var(--color-bg-alt);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.timeline-date {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.timeline-note {
  margin: 3px 0 0;
  font-size: 13.5px;
  color: var(--color-text);
  white-space: pre-wrap;
}

.timeline-remove {
  position: absolute;
  right: 6px;
  top: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-faint);
  font-size: 16px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.timeline-item:hover .timeline-remove {
  opacity: 1;
}

.timeline-remove:hover {
  color: var(--color-danger);
}
</style>
