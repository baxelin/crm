<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { contactsApi } from '../api'
import { useRequest } from '../composables/useRequest'
import { CONTACT_STATUS_LABELS } from '../constants/labels'
import { formatDate } from '../utils/format'
import FilterTabs from '../components/FilterTabs.vue'
import QuickActions from '../components/QuickActions.vue'
import StatusBadge from '../components/StatusBadge.vue'

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'lead', label: 'Leads' },
  { value: 'cliente', label: 'Clientes' },
  { value: 'inativo', label: 'Inativos' },
]
const SEARCH_DEBOUNCE_MS = 250

const router = useRouter()
const contacts = ref([])
const statusFilter = ref('')
const search = ref('')
const { loading, error, run } = useRequest(true)

let searchTimer = null

async function load() {
  await run(async () => {
    contacts.value = await contactsApi.list({ status: statusFilter.value, q: search.value })
  })
}

watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(load, SEARCH_DEBOUNCE_MS)
})
watch(statusFilter, load)

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-eyebrow">Leads &amp; Clientes</div>
        <h1>Contatos</h1>
      </div>
      <router-link to="/contatos/novo" class="btn btn-primary">+ Novo lead</router-link>
    </div>

    <div class="toolbar">
      <input v-model="search" type="search" placeholder="Buscar por nome..." class="search-input" />
      <FilterTabs v-model="statusFilter" :options="STATUS_FILTERS" />
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
    <div v-if="loading" class="empty-state">Carregando contatos...</div>
    <div v-else-if="!contacts.length" class="empty-state card">Nenhum contato encontrado.</div>

    <div v-else class="contact-list">
      <div
        v-for="contact in contacts"
        :key="contact.id"
        class="contact-row card"
        @click="router.push(`/contatos/${contact.id}`)"
      >
        <div class="contact-main">
          <span class="contact-name">{{ contact.name }}</span>
          <span class="contact-sub">{{ contact.origin || 'Origem não informada' }}</span>
        </div>
        <StatusBadge :status="contact.status" :label="CONTACT_STATUS_LABELS[contact.status]" />
        <span class="contact-last">Último contato: {{ formatDate(contact.last_contact_date) }}</span>
        <QuickActions :contact="contact" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.search-input {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 9px 14px;
  min-width: 240px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-softer);
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.contact-row:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.contact-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 180px;
  flex: 1;
}

.contact-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 15.5px;
}

.contact-sub,
.contact-last {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.contact-last {
  min-width: 170px;
}
</style>
