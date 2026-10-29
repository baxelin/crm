<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { paymentsApi } from '../api'
import { useRequest } from '../composables/useRequest'
import { PAYMENT_STATUS_LABELS, SERVICE_TYPE_LABELS } from '../constants/labels'
import { formatCurrency, formatDate, todayISO } from '../utils/format'
import FilterTabs from '../components/FilterTabs.vue'
import StatusBadge from '../components/StatusBadge.vue'

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'pago', label: 'Pagos' },
  { value: 'atrasado', label: 'Atrasados' },
]

const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())
const currentMonth = todayISO().slice(0, 7)

const router = useRouter()
const payments = ref([])
const statusFilter = ref('')
const togglingId = ref(null)
const { loading, error, run } = useRequest(true)

function isInCurrentMonth(date) {
  return date?.slice(0, 7) === currentMonth
}

function sumAmounts(list, type) {
  return list.filter((p) => !type || p.type === type).reduce((total, p) => total + p.amount, 0)
}

const receivedThisMonth = computed(() =>
  payments.value.filter((p) => p.status === 'pago' && isInCurrentMonth(p.paid_date))
)
const dueThisMonth = computed(() => payments.value.filter((p) => isInCurrentMonth(p.due_date)))

const stats = computed(() => [
  {
    label: 'Receita única',
    description: `Pagamentos únicos recebidos em ${monthLabel}`,
    received: sumAmounts(receivedThisMonth.value, 'unico'),
    expected: sumAmounts(dueThisMonth.value, 'unico'),
  },
  {
    label: 'Receita mensal',
    description: `Mensalidades recebidas em ${monthLabel}`,
    received: sumAmounts(receivedThisMonth.value, 'mensalidade'),
    expected: sumAmounts(dueThisMonth.value, 'mensalidade'),
  },
  {
    label: 'Total do mês',
    description: `Todos os recebimentos em ${monthLabel}`,
    received: sumAmounts(receivedThisMonth.value),
    expected: sumAmounts(dueThisMonth.value),
    highlight: true,
  },
])

const filteredPayments = computed(() =>
  statusFilter.value ? payments.value.filter((p) => p.status === statusFilter.value) : payments.value
)

async function load() {
  await run(async () => {
    payments.value = await paymentsApi.listAll()
  })
}

async function togglePaid(payment) {
  togglingId.value = payment.id
  try {
    const updated = await paymentsApi.update(payment.id, {
      paid_date: payment.status === 'pago' ? null : todayISO(),
    })
    Object.assign(payment, updated)
  } catch (e) {
    error.value = e.message
  } finally {
    togglingId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="page wide">
    <div class="page-header">
      <div>
        <div class="page-eyebrow">Financeiro</div>
        <h1>Finanças</h1>
      </div>
    </div>

    <div class="stat-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card card" :class="{ highlight: stat.highlight }">
        <span class="stat-label">{{ stat.label }}</span>
        <span class="stat-value">{{ formatCurrency(stat.received) }}</span>
        <span class="stat-sub">{{ stat.description }}</span>
        <span class="stat-estimate">Estimado do mês: {{ formatCurrency(stat.expected) }}</span>
      </div>
    </div>

    <div class="toolbar">
      <h3>Pagamentos</h3>
      <FilterTabs v-model="statusFilter" :options="STATUS_FILTERS" />
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
    <div v-if="loading" class="empty-state">Carregando pagamentos...</div>
    <div v-else-if="!filteredPayments.length" class="empty-state card">Nenhum pagamento encontrado.</div>

    <div v-else class="table-wrap card">
      <table class="payments-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Serviço</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Status</th>
            <th class="centered">Pago</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in filteredPayments" :key="payment.id">
            <td class="cell-name">{{ payment.contact_name }}</td>
            <td class="cell-muted">{{ SERVICE_TYPE_LABELS[payment.service_type] || '—' }}</td>
            <td class="cell-amount">{{ formatCurrency(payment.amount) }}</td>
            <td>{{ formatDate(payment.paid_date || payment.due_date) }}</td>
            <td><StatusBadge :status="payment.status" :label="PAYMENT_STATUS_LABELS[payment.status]" /></td>
            <td class="centered">
              <button
                class="paid-toggle"
                :class="{ paid: payment.status === 'pago' }"
                :disabled="togglingId === payment.id"
                :title="payment.status === 'pago' ? 'Marcar como não pago' : 'Marcar como pago'"
                @click="togglePaid(payment)"
              >
                <svg v-if="payment.status === 'pago'" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5 6.2 12 13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <svg v-else viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </button>
            </td>
            <td class="cell-action">
              <button class="btn btn-secondary btn-sm" @click="router.push(`/contatos/${payment.contact_id}`)">
                Ver cliente
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page.wide {
  max-width: none;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin: 2px 0;
}

.stat-sub {
  font-size: 12px;
  color: var(--color-text-muted);
}

.stat-estimate {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-accent);
  margin-top: 6px;
}

.stat-card.highlight {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.stat-card.highlight .stat-label,
.stat-card.highlight .stat-sub {
  color: var(--color-accent-softer);
}

.stat-card.highlight .stat-value,
.stat-card.highlight .stat-estimate {
  color: #fff8f2;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.toolbar h3 {
  font-size: 17px;
}

.table-wrap {
  overflow-x: auto;
  padding: 6px;
}

.payments-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.payments-table th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  font-weight: 600;
  padding: 12px 16px;
}

.payments-table td {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border-soft);
}

.payments-table tbody tr {
  transition: background 0.15s ease;
}

.payments-table tbody tr:hover {
  background: var(--color-bg-alt);
}

.payments-table .centered {
  text-align: center;
}

.cell-name {
  font-weight: 600;
  font-family: var(--font-display);
}

.cell-muted {
  color: var(--color-text-muted);
}

.cell-amount {
  font-weight: 600;
}

.cell-action {
  text-align: right;
}

.paid-toggle {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-danger-soft);
  color: var(--color-danger);
  transition: all 0.15s ease;
}

.paid-toggle svg {
  width: 13px;
  height: 13px;
}

.paid-toggle.paid {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.paid-toggle:hover {
  opacity: 0.8;
}

.paid-toggle:disabled {
  opacity: 0.5;
  cursor: default;
}

@media (max-width: 860px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
