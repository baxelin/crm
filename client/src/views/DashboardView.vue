<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tasksApi, paymentsApi } from '../api'
import { useRequest } from '../composables/useRequest'
import { PERIOD_LABELS } from '../constants/labels'
import { formatCurrency, formatDate, toISODate, todayISO } from '../utils/format'
import TaskCheckbox from '../components/TaskCheckbox.vue'

const DAYS_AHEAD = 7
const PERIOD_ORDER = ['manha', 'tarde', 'dia_inteiro']

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const dayMonthFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })

const router = useRouter()
const tasks = ref([])
const alerts = ref([])
const { loading, error, run } = useRequest(true)

const days = Array.from({ length: DAYS_AHEAD }, (_, offset) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return {
    iso: toISODate(date),
    weekday: weekdayFormatter.format(date),
    dayMonth: dayMonthFormatter.format(date),
    isToday: offset === 0,
  }
})

const tasksByDay = computed(() => {
  const grouped = Object.fromEntries(days.map((day) => [day.iso, []]))
  for (const task of tasks.value) grouped[task.date]?.push(task)
  for (const dayTasks of Object.values(grouped)) {
    dayTasks.sort((a, b) => PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period))
  }
  return grouped
})

const overdueCount = computed(() => alerts.value.filter((alert) => alert.status === 'atrasado').length)
const upcomingCount = computed(() => alerts.value.length - overdueCount.value)

async function load() {
  await run(async () => {
    const [taskRows, alertRows] = await Promise.all([
      tasksApi.list({ from: days[0].iso, to: days.at(-1).iso }),
      paymentsApi.listUpcoming(DAYS_AHEAD),
    ])
    tasks.value = taskRows
    alerts.value = alertRows
  })
}

function openTask(task) {
  router.push(task.contact_id ? `/contatos/${task.contact_id}` : `/tarefas/${task.id}/editar`)
}

function addTask(date = todayISO()) {
  router.push({ name: 'task-new', query: { date } })
}

function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

onMounted(load)
</script>

<template>
  <div class="page wide">
    <div class="page-header">
      <div>
        <div class="page-eyebrow">Agenda</div>
        <h1>Dashboard</h1>
      </div>
      <button class="btn btn-primary" @click="addTask()">+ Nova tarefa</button>
    </div>

    <div v-if="alerts.length" class="alerts-bar">
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M10 2.5 18 17H2L10 2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
        <path d="M10 8v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        <circle cx="10" cy="14.3" r="0.9" fill="currentColor" />
      </svg>
      <span>
        <strong v-if="overdueCount">{{ plural(overdueCount, 'pagamento atrasado', 'pagamentos atrasados') }}</strong>
        <template v-if="overdueCount && upcomingCount"> · </template>
        <strong v-if="upcomingCount">{{ upcomingCount }} vencendo nos próximos {{ DAYS_AHEAD }} dias</strong>
      </span>
      <div class="alerts-list">
        <router-link
          v-for="alert in alerts"
          :key="alert.id"
          :to="`/contatos/${alert.contact_id}`"
          class="alert-chip"
          :class="{ overdue: alert.status === 'atrasado' }"
        >
          {{ alert.contact_name }} · {{ formatCurrency(alert.amount) }} · {{ formatDate(alert.due_date) }}
        </router-link>
      </div>
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
    <div v-if="loading" class="empty-state">Carregando agenda...</div>

    <div v-else class="week-grid">
      <div v-for="day in days" :key="day.iso" class="day-col" :class="{ today: day.isToday }">
        <div class="day-head">
          <div class="day-label">
            <span class="weekday">{{ day.weekday }}</span>
            <span class="daynum">{{ day.dayMonth }}</span>
          </div>
          <button class="day-add" title="Adicionar tarefa" @click="addTask(day.iso)">+</button>
        </div>

        <div class="day-tasks">
          <div v-for="task in tasksByDay[day.iso]" :key="task.id" class="task-item" :class="{ done: task.done }">
            <TaskCheckbox v-model:done="task.done" :task-id="task.id" @error="error = $event" />
            <div class="task-body" @click="openTask(task)">
              <span class="task-period">{{ PERIOD_LABELS[task.period] }}</span>
              <span class="task-title">{{ task.title }}</span>
              <span class="task-contact">{{ task.contact_name || 'Interno' }}</span>
            </div>
          </div>

          <div v-if="!tasksByDay[day.iso].length" class="day-empty">Sem tarefas</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page.wide {
  max-width: none;
}

.alerts-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  background: var(--color-warning-soft);
  color: var(--color-warning);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  margin-bottom: 24px;
  font-size: 13.5px;
}

.alerts-bar svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.alerts-list {
  width: 100%;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.alert-chip {
  background: var(--color-surface-raised);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  transition: all 0.15s ease;
}

.alert-chip.overdue {
  color: var(--color-danger);
}

.alert-chip:hover {
  box-shadow: var(--shadow-sm);
  color: var(--color-text);
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
}

.day-col {
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  padding: 12px;
  min-height: 260px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.day-col.today {
  background: var(--color-surface-raised);
  border-color: var(--color-accent);
  box-shadow: var(--shadow-md);
}

.day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border-soft);
}

.day-label {
  display: flex;
  flex-direction: column;
}

.weekday {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  font-weight: 600;
}

.today .weekday {
  color: var(--color-accent);
}

.daynum {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
}

.day-add {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: none;
  background: var(--color-bg-alt);
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.day-add:hover {
  background: var(--color-accent);
  color: #fff;
}

.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  border-radius: var(--radius-sm);
  padding: 6px;
  transition: background 0.15s ease;
}

.task-item:hover {
  background: var(--color-bg-alt);
}

.task-item.done .task-title {
  text-decoration: line-through;
  color: var(--color-text-faint);
}

.task-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  cursor: pointer;
  min-width: 0;
}

.task-period {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-accent);
  font-weight: 700;
}

.task-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  overflow-wrap: break-word;
  hyphens: auto;
  line-height: 1.3;
}

.task-contact {
  font-size: 11.5px;
  color: var(--color-text-muted);
}

.day-empty {
  font-size: 12px;
  color: var(--color-text-faint);
  padding: 8px;
  font-style: italic;
}
</style>
