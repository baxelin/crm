<script setup>
import { ref, onMounted } from 'vue'
import { servicesApi } from '../../api'
import { useRequest } from '../../composables/useRequest'
import { SERVICE_TYPE_LABELS, SERVICE_STATUS_LABELS } from '../../constants/labels'
import { formatDate, todayISO } from '../../utils/format'

const props = defineProps({
  contactId: { type: [String, Number], required: true },
})
const emit = defineEmits(['changed'])

const services = ref([])
const showForm = ref(false)
const chargeFormFor = ref(null)
const form = ref(emptyForm())
const chargeForm = ref(emptyChargeForm())

const { loading, error, run } = useRequest(true)
const { loading: saving, error: saveError, run: save } = useRequest()

function emptyForm() {
  return { type: 'site', description: '', status: 'ativo', started_at: todayISO() }
}

function emptyChargeForm() {
  return { amount: '', due_date: todayISO(), notes: '' }
}

async function load() {
  await run(async () => {
    services.value = await servicesApi.listForContact(props.contactId)
  })
}

async function afterChange() {
  await load()
  emit('changed')
}

async function submit() {
  const ok = await save(() => servicesApi.create(props.contactId, form.value))
  if (!ok) return
  form.value = emptyForm()
  showForm.value = false
  await afterChange()
}

async function updateStatus(service, status) {
  if (await save(() => servicesApi.update(service.id, { status }))) await load()
}

async function remove(id) {
  if (await save(() => servicesApi.remove(id))) await afterChange()
}

function openChargeForm(service) {
  chargeFormFor.value = service.id
  chargeForm.value = emptyChargeForm()
}

async function submitCharge(service) {
  if (!chargeForm.value.amount) return
  const ok = await save(() => servicesApi.generateCharge(service.id, chargeForm.value))
  if (!ok) return
  chargeFormFor.value = null
  emit('changed')
}

onMounted(load)
</script>

<template>
  <section class="card panel">
    <div class="panel-head">
      <h3>Serviços contratados</h3>
      <button class="btn btn-secondary btn-sm" @click="showForm = !showForm">
        {{ showForm ? 'Cancelar' : '+ Adicionar' }}
      </button>
    </div>

    <form v-if="showForm" class="inline-form" @submit.prevent="submit">
      <div class="grid-2">
        <select v-model="form.type">
          <option v-for="(label, value) in SERVICE_TYPE_LABELS" :key="value" :value="value">{{ label }}</option>
        </select>
        <input v-model="form.started_at" type="date" />
      </div>
      <input v-model="form.description" type="text" placeholder="Descrição (ex: manutenção mensal do site X)" />
      <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">Salvar</button>
    </form>

    <p v-if="error || saveError" class="error-text">{{ error || saveError }}</p>
    <div v-if="loading" class="empty-state">Carregando...</div>
    <div v-else-if="!services.length" class="empty-state">Nenhum serviço cadastrado ainda.</div>

    <div v-else class="service-list">
      <div v-for="service in services" :key="service.id" class="service-card">
        <div class="service-top">
          <div>
            <span class="service-type">{{ SERVICE_TYPE_LABELS[service.type] || service.type }}</span>
            <p v-if="service.description" class="service-desc">{{ service.description }}</p>
            <span class="service-date">Desde {{ formatDate(service.started_at) }}</span>
          </div>
          <select class="status-select" :value="service.status" @change="updateStatus(service, $event.target.value)">
            <option v-for="(label, value) in SERVICE_STATUS_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>

        <div class="service-actions">
          <button v-if="service.status === 'ativo'" class="btn btn-ghost btn-sm" @click="openChargeForm(service)">
            Gerar cobrança do mês
          </button>
          <button class="btn btn-ghost btn-sm danger" @click="remove(service.id)">Remover</button>
        </div>

        <form v-if="chargeFormFor === service.id" class="charge-form" @submit.prevent="submitCharge(service)">
          <input v-model="chargeForm.amount" type="number" step="0.01" min="0" placeholder="Valor (R$)" required />
          <input v-model="chargeForm.due_date" type="date" required />
          <input v-model="chargeForm.notes" type="text" placeholder="Notas (opcional)" />
          <div class="charge-form-actions">
            <button type="button" class="btn btn-ghost btn-sm" @click="chargeFormFor = null">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">Gerar</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.service-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.service-card {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: 14px 16px;
}

.service-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.service-type {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14.5px;
}

.service-desc {
  margin: 3px 0;
  font-size: 13px;
  color: var(--color-text-muted);
}

.service-date {
  font-size: 11.5px;
  color: var(--color-text-faint);
}

.status-select {
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.service-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.charge-form {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background: var(--color-bg-alt);
  padding: 12px;
  border-radius: var(--radius-sm);
}

.charge-form input {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 7px 10px;
}

.charge-form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
