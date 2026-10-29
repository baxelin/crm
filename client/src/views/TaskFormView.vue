<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { tasksApi, contactsApi } from '../api'
import { useRequest } from '../composables/useRequest'
import { PERIOD_LABELS, RECURRENCE_LABELS, RECURRENCE_UNIT_LABELS } from '../constants/labels'
import { todayISO } from '../utils/format'
import Modal from '../components/Modal.vue'

const props = defineProps({
  id: { type: [String, Number], default: null },
})

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => Boolean(props.id))

const contacts = ref([])
const isPartOfSeries = ref(false)
const pendingSeriesAction = ref(null)
const form = ref({
  contact_id: Number(route.query.contact_id) || '',
  date: route.query.date || todayISO(),
  period: 'dia_inteiro',
  title: '',
  notes: '',
  done: false,
})
const recurrence = ref({ type: 'none', interval: 1, unit: 'semanal' })

const { loading, error, run } = useRequest()

async function load() {
  await run(async () => {
    contacts.value = await contactsApi.list()
    if (!isEdit.value) return

    const task = await tasksApi.get(props.id)
    form.value = {
      contact_id: task.contact_id || '',
      date: task.date,
      period: task.period,
      title: task.title,
      notes: task.notes || '',
      done: Boolean(task.done),
    }
    isPartOfSeries.value = Boolean(task.recurrence_group_id)
  })
}

function recurrencePayload() {
  const { type, interval, unit } = recurrence.value
  if (isEdit.value || type === 'none') return {}
  if (type === 'personalizado') return { recurrence_unit: unit, recurrence_interval: Math.max(1, Number(interval) || 1) }
  return { recurrence_unit: type, recurrence_interval: 1 }
}

function buildPayload(scope) {
  return {
    ...form.value,
    contact_id: form.value.contact_id || null,
    done: form.value.done ? 1 : 0,
    ...recurrencePayload(),
    ...(scope === 'this' ? {} : { scope }),
  }
}

function goBack() {
  router.push(form.value.contact_id ? `/contatos/${form.value.contact_id}` : '/')
}

async function save(scope) {
  const ok = await run(() =>
    isEdit.value ? tasksApi.update(props.id, buildPayload(scope)) : tasksApi.create(buildPayload(scope))
  )
  if (ok) goBack()
}

async function remove(scope) {
  const ok = await run(() => tasksApi.remove(props.id, scope === 'this' ? undefined : scope))
  if (ok) goBack()
}

function requestSave() {
  if (!form.value.title.trim() || !form.value.date) {
    error.value = 'Título e data são obrigatórios'
    return
  }
  if (isEdit.value && isPartOfSeries.value) pendingSeriesAction.value = 'save'
  else save('this')
}

function requestRemove() {
  if (!confirm('Remover esta tarefa?')) return
  if (isPartOfSeries.value) pendingSeriesAction.value = 'remove'
  else remove('this')
}

function chooseScope(scope) {
  const action = pendingSeriesAction.value === 'save' ? save : remove
  pendingSeriesAction.value = null
  action(scope)
}

onMounted(load)
</script>

<template>
  <div class="page narrow">
    <div class="page-header">
      <div>
        <div class="page-eyebrow">Agenda</div>
        <h1>{{ isEdit ? 'Editar tarefa' : 'Nova tarefa' }}</h1>
      </div>
      <button class="btn btn-ghost" @click="router.back()">Cancelar</button>
    </div>

    <form class="card form-card" @submit.prevent="requestSave">
      <p v-if="error" class="error-text">{{ error }}</p>
      <p v-if="isPartOfSeries" class="series-note">Esta tarefa faz parte de uma série recorrente.</p>

      <div class="field">
        <label>Contato vinculado</label>
        <select v-model="form.contact_id">
          <option value="">Interno (sem contato)</option>
          <option v-for="contact in contacts" :key="contact.id" :value="contact.id">{{ contact.name }}</option>
        </select>
      </div>

      <div class="grid-2">
        <div class="field">
          <label>Data</label>
          <input v-model="form.date" type="date" required />
        </div>
        <div class="field">
          <label>Período</label>
          <select v-model="form.period">
            <option v-for="(label, value) in PERIOD_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>Título</label>
        <input v-model="form.title" type="text" required placeholder="Ex: Social media, Manutenção do site..." />
      </div>

      <div class="field">
        <label>Notas</label>
        <textarea v-model="form.notes" placeholder="Detalhes adicionais"></textarea>
      </div>

      <template v-if="!isEdit">
        <div class="field">
          <label>Recorrência</label>
          <select v-model="recurrence.type">
            <option v-for="(label, value) in RECURRENCE_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>

        <div v-if="recurrence.type === 'personalizado'" class="grid-2">
          <div class="field">
            <label>Repetir a cada</label>
            <input v-model.number="recurrence.interval" type="number" min="1" step="1" />
          </div>
          <div class="field">
            <label>Unidade</label>
            <select v-model="recurrence.unit">
              <option v-for="(label, unit) in RECURRENCE_UNIT_LABELS" :key="unit" :value="unit">{{ label }}</option>
            </select>
          </div>
        </div>
      </template>

      <label class="checkbox-row">
        <input v-model="form.done" type="checkbox" />
        Concluída
      </label>

      <div class="form-actions" :class="{ spaced: isEdit }">
        <button v-if="isEdit" type="button" class="btn btn-danger" @click="requestRemove">Remover</button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ isEdit ? 'Salvar alterações' : 'Criar tarefa' }}
        </button>
      </div>
    </form>

    <Modal
      v-if="pendingSeriesAction"
      :title="pendingSeriesAction === 'save' ? 'Salvar alterações' : 'Remover tarefa'"
      @close="pendingSeriesAction = null"
    >
      <p class="scope-question">Esta tarefa faz parte de uma série recorrente. O que deseja fazer?</p>
      <div class="scope-actions">
        <button class="btn btn-secondary" @click="chooseScope('this')">Somente esta</button>
        <button class="btn btn-secondary" @click="chooseScope('following')">Esta e as seguintes</button>
        <button class="btn btn-secondary" @click="chooseScope('all')">Todas da série</button>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.page.narrow {
  max-width: 560px;
}

.series-note {
  margin: 0;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-alt);
  color: var(--color-text-muted);
  font-size: 12.5px;
}

.form-actions.spaced {
  justify-content: space-between;
}

.scope-question {
  margin: 0 0 16px;
  color: var(--color-text-muted);
  font-size: 13.5px;
}

.scope-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
