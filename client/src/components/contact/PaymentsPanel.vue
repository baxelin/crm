<script setup>
import { ref, onMounted } from 'vue'
import { paymentsApi, servicesApi } from '../../api'
import { useRequest } from '../../composables/useRequest'
import { PAYMENT_TYPE_LABELS, PAYMENT_STATUS_LABELS, SERVICE_TYPE_LABELS } from '../../constants/labels'
import { formatDate, formatCurrency, todayISO } from '../../utils/format'
import StatusBadge from '../StatusBadge.vue'

const props = defineProps({
  contactId: { type: [String, Number], required: true },
})

const payments = ref([])
const services = ref([])
const showForm = ref(false)
const payFormFor = ref(null)
const form = ref(emptyForm())
const payForm = ref(emptyPayForm())

const { loading, error, run } = useRequest(true)
const { loading: saving, error: saveError, run: save } = useRequest()

function emptyForm() {
  return { type: 'unico', service_id: '', amount: '', due_date: '', notes: '' }
}

function emptyPayForm() {
  return { paid_date: todayISO(), file: null }
}

async function load() {
  await run(async () => {
    const [paymentRows, serviceRows] = await Promise.all([
      paymentsApi.listForContact(props.contactId),
      servicesApi.listForContact(props.contactId),
    ])
    payments.value = paymentRows
    services.value = serviceRows
  })
}


async function submit() {
  if (!form.value.amount) return
  const ok = await save(() => paymentsApi.create(props.contactId, form.value))
  if (!ok) return
  form.value = emptyForm()
  showForm.value = false
  await load()
}

function openPayForm(payment) {
  payFormFor.value = payment.id
  payForm.value = emptyPayForm()
}

async function submitMarkPaid(payment) {
  const formData = new FormData()
  formData.append('paid_date', payForm.value.paid_date)
  if (payForm.value.file) formData.append('proof', payForm.value.file)

  const ok = await save(() => paymentsApi.markPaid(payment.id, formData))
  if (!ok) return
  payFormFor.value = null
  await load()
}

async function remove(id) {
  if (await save(() => paymentsApi.remove(id))) await load()
}

function serviceLabel(serviceId) {
  const service = services.value.find((s) => s.id === serviceId)
  return service ? SERVICE_TYPE_LABELS[service.type] : ''
}

onMounted(load)
</script>

<template>
  <section class="card panel">
    <div class="panel-head">
      <h3>Pagamentos</h3>
      <button class="btn btn-secondary btn-sm" @click="showForm = !showForm">
        {{ showForm ? 'Cancelar' : '+ Adicionar' }}
      </button>
    </div>

    <form v-if="showForm" class="inline-form" @submit.prevent="submit">
      <div class="grid-3">
        <select v-model="form.type">
          <option v-for="(label, value) in PAYMENT_TYPE_LABELS" :key="value" :value="value">{{ label }}</option>
        </select>
        <select v-model="form.service_id">
          <option value="">Sem serviço vinculado</option>
          <option v-for="service in services" :key="service.id" :value="service.id">
            {{ SERVICE_TYPE_LABELS[service.type] }}
          </option>
        </select>
        <input v-model="form.amount" type="number" step="0.01" min="0" placeholder="Valor (R$)" required />
      </div>
      <div class="grid-2">
        <input v-model="form.due_date" type="date" />
        <input v-model="form.notes" type="text" placeholder="Notas (opcional)" />
      </div>
      <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">Salvar</button>
    </form>

    <p v-if="error || saveError" class="error-text">{{ error || saveError }}</p>
    <div v-if="loading" class="empty-state">Carregando...</div>
    <div v-else-if="!payments.length" class="empty-state">Nenhum pagamento registrado ainda.</div>

    <div v-else class="payment-list">
      <div v-for="payment in payments" :key="payment.id" class="payment-row">
        <div class="payment-top">
          <span class="payment-amount">{{ formatCurrency(payment.amount) }}</span>
          <StatusBadge :status="payment.status" :label="PAYMENT_STATUS_LABELS[payment.status]" />
          <span class="payment-meta">{{ PAYMENT_TYPE_LABELS[payment.type] }}</span>
          <span v-if="payment.service_id" class="payment-meta">· {{ serviceLabel(payment.service_id) }}</span>
        </div>
        <div class="payment-dates">
          <span>Vencimento: {{ formatDate(payment.due_date) }}</span>
          <span v-if="payment.paid_date">Pago em: {{ formatDate(payment.paid_date) }}</span>
        </div>
        <p v-if="payment.notes" class="payment-notes">{{ payment.notes }}</p>
        <a v-if="payment.proof_file_path" :href="payment.proof_file_path" target="_blank" rel="noopener" class="payment-proof">
          Ver comprovante
        </a>

        <div class="payment-actions">
          <button v-if="payment.status !== 'pago'" class="btn btn-secondary btn-sm" @click="openPayForm(payment)">
            Marcar como pago
          </button>
          <button class="btn btn-ghost btn-sm danger" @click="remove(payment.id)">Remover</button>
        </div>

        <form v-if="payFormFor === payment.id" class="pay-form" @submit.prevent="submitMarkPaid(payment)">
          <input v-model="payForm.paid_date" type="date" required />
          <input type="file" accept="image/*,application/pdf" @change="payForm.file = $event.target.files[0] || null" />
          <div class="pay-form-actions">
            <button type="button" class="btn btn-ghost btn-sm" @click="payFormFor = null">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">Confirmar pagamento</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.payment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.payment-row {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: 14px 16px;
}

.payment-top {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.payment-amount {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
}

.payment-meta {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.payment-dates {
  display: flex;
  gap: 14px;
  margin-top: 5px;
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.payment-notes {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--color-text);
}

.payment-proof {
  display: inline-block;
  margin-top: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-accent);
}

.payment-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.pay-form {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  background: var(--color-bg-alt);
  padding: 12px;
  border-radius: var(--radius-sm);
}

.pay-form input[type='date'] {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 7px 10px;
}

.pay-form-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
</style>
