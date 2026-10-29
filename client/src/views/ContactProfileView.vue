<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { contactsApi } from '../api'
import { useRequest } from '../composables/useRequest'
import { CONTACT_STATUS_LABELS } from '../constants/labels'
import { formatDate } from '../utils/format'
import QuickActions from '../components/QuickActions.vue'
import StatusBadge from '../components/StatusBadge.vue'
import InteractionsPanel from '../components/contact/InteractionsPanel.vue'
import ServicesPanel from '../components/contact/ServicesPanel.vue'
import PaymentsPanel from '../components/contact/PaymentsPanel.vue'
import TasksPanel from '../components/contact/TasksPanel.vue'
import PromoteModal from '../components/contact/PromoteModal.vue'

const props = defineProps({
  id: { type: [String, Number], required: true },
})

const router = useRouter()
const contact = ref(null)
const showPromote = ref(false)
const paymentsPanelKey = ref(0)
const { loading, error, run } = useRequest(true)

const isLead = computed(() => contact.value?.status === 'lead')
const isClient = computed(() => contact.value?.status === 'cliente')

const details = computed(() => [
  { label: 'Telefone', value: contact.value.phone },
  { label: 'E-mail', value: contact.value.email },
  { label: 'Endereço', value: contact.value.address, wide: true },
  { label: 'Website', value: contact.value.website },
  { label: 'Origem', value: contact.value.origin },
  { label: 'Primeiro contato', value: formatDate(contact.value.first_contact_date) },
  { label: 'Último contato', value: formatDate(contact.value.last_contact_date) },
])

async function load() {
  await run(async () => {
    contact.value = await contactsApi.get(props.id)
  })
}

function refreshPayments() {
  paymentsPanelKey.value++
}

function onPromoted() {
  showPromote.value = false
  load()
}

async function removeContact() {
  if (!confirm(`Remover ${contact.value.name}? Essa ação não pode ser desfeita.`)) return
  if (await run(() => contactsApi.remove(props.id))) router.push('/contatos')
}

onMounted(load)
</script>

<template>
  <div class="page">
    <button class="btn btn-ghost back-link" @click="router.push('/contatos')">← Contatos</button>

    <p v-if="error" class="error-text">{{ error }}</p>
    <div v-if="loading && !contact" class="empty-state">Carregando...</div>

    <template v-if="contact">
      <div class="profile-header">
        <div>
          <div class="page-eyebrow">{{ CONTACT_STATUS_LABELS[contact.status] }}</div>
          <h1>{{ contact.name }}</h1>
          <div class="profile-badges">
            <StatusBadge :status="contact.status" :label="CONTACT_STATUS_LABELS[contact.status]" />
            <span class="muted">Último contato: {{ formatDate(contact.last_contact_date) }}</span>
          </div>
        </div>

        <div class="profile-actions">
          <QuickActions :contact="contact" size="lg" />
          <button class="btn btn-secondary" @click="router.push(`/contatos/${contact.id}/editar`)">Editar</button>
          <button v-if="isLead" class="btn btn-primary" @click="showPromote = true">Promover a cliente</button>
        </div>
      </div>

      <div class="profile-grid">
        <div class="profile-column">
          <section class="card panel">
            <h3>Dados cadastrais</h3>
            <dl class="info-grid">
              <div v-for="detail in details" :key="detail.label" :class="{ wide: detail.wide }">
                <dt>{{ detail.label }}</dt>
                <dd>{{ detail.value || '—' }}</dd>
              </div>
              <div v-if="contact.notes" class="wide">
                <dt>Observações</dt>
                <dd class="notes">{{ contact.notes }}</dd>
              </div>
            </dl>
          </section>

          <InteractionsPanel :contact-id="contact.id" @changed="load" />

          <template v-if="isClient">
            <ServicesPanel :contact-id="contact.id" @changed="refreshPayments" />
            <PaymentsPanel :key="paymentsPanelKey" :contact-id="contact.id" />
          </template>
        </div>

        <div class="profile-column">
          <TasksPanel :contact-id="contact.id" />

          <section class="card panel danger-panel">
            <h3>Zona de risco</h3>
            <p>Remover este contato apaga também interações, serviços, pagamentos e tarefas vinculadas.</p>
            <button class="btn btn-danger btn-sm" @click="removeContact">Remover contato</button>
          </section>
        </div>
      </div>

      <PromoteModal v-if="showPromote" :contact-id="contact.id" @close="showPromote = false" @promoted="onPromoted" />
    </template>
  </div>
</template>

<style scoped>
.back-link {
  margin-bottom: 12px;
  padding-left: 4px;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.profile-header h1 {
  font-size: 30px;
}

.profile-badges {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.muted {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.profile-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
}

.profile-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 20px;
  margin: 0;
}

.info-grid .wide {
  grid-column: 1 / -1;
}

.info-grid dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  font-weight: 600;
  margin-bottom: 3px;
}

.info-grid dd {
  margin: 0;
  font-size: 14px;
  color: var(--color-text);
}

.info-grid dd.notes {
  white-space: pre-wrap;
}

.danger-panel p {
  font-size: 12.5px;
  color: var(--color-text-muted);
  margin: 0 0 12px;
}

@media (max-width: 960px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
