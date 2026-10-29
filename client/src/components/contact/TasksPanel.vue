<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tasksApi } from '../../api'
import { useRequest } from '../../composables/useRequest'
import { PERIOD_LABELS } from '../../constants/labels'
import { formatDate } from '../../utils/format'
import TaskCheckbox from '../TaskCheckbox.vue'

const props = defineProps({
  contactId: { type: [String, Number], required: true },
})

const router = useRouter()
const tasks = ref([])
const { loading, error, run } = useRequest(true)

async function load() {
  await run(async () => {
    tasks.value = await tasksApi.listForContact(props.contactId)
  })
}

function addTask() {
  router.push({ name: 'task-new', query: { contact_id: props.contactId } })
}

function editTask(id) {
  router.push({ name: 'task-edit', params: { id } })
}

onMounted(load)
</script>

<template>
  <section class="card panel">
    <div class="panel-head">
      <h3>Tarefas &amp; agenda</h3>
      <button class="btn btn-secondary btn-sm" @click="addTask">+ Adicionar</button>
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
    <div v-if="loading" class="empty-state">Carregando...</div>
    <div v-else-if="!tasks.length" class="empty-state">Nenhuma tarefa vinculada.</div>

    <ul v-else class="task-list">
      <li v-for="task in tasks" :key="task.id" class="task-row" :class="{ done: task.done }">
        <TaskCheckbox v-model:done="task.done" :task-id="task.id" @error="error = $event" />
        <div class="task-info" @click="editTask(task.id)">
          <span class="task-title">{{ task.title }}</span>
          <span class="task-meta">{{ formatDate(task.date) }} · {{ PERIOD_LABELS[task.period] }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  transition: background 0.15s ease;
}

.task-row:hover {
  background: var(--color-bg-alt);
}

.task-row.done .task-title {
  text-decoration: line-through;
  color: var(--color-text-faint);
}

.task-info {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  min-width: 0;
}

.task-title {
  font-size: 13.5px;
  font-weight: 600;
}

.task-meta {
  font-size: 11.5px;
  color: var(--color-text-muted);
}
</style>
