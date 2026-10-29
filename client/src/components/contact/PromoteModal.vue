<script setup>
import { ref } from 'vue'
import { contactsApi } from '../../api'
import { useRequest } from '../../composables/useRequest'
import { SERVICE_TYPE_LABELS, PAYMENT_TYPE_LABELS } from '../../constants/labels'
import { todayISO } from '../../utils/format'
import Modal from '../Modal.vue'

const props = defineProps({
  contactId: { type: [String, Number], required: true },
})
const emit = defineEmits(['close', 'promoted'])

const service = ref({ type: 'site', description: '', started_at: todayISO() })
const payment = ref({ type: 'unico', amount: '', due_date: '', paid_date: '', notes: '' })
const includePayment = ref(true)
const { loading: saving, error, run } = useRequest()

async function submit() {
  const body = {
    service: service.value,
    payment: includePayment.value && payment.value.amount ? payment.value : null,
  }
  if (await run(() => contactsApi.promote(props.contactId, body))) emit('promoted')
}
</script>

<template>
  <Modal title="Promover a cliente" @close="emit('close')">
    <form class="promote-form" @submit.prevent="submit">
      <p class="promote-intro">
        Preencha o serviço contratado (e o primeiro pagamento, se já combinado) para converter este lead em cliente.
      </p>

      <p v-if="error" class="error-text">{{ error }}</p>

      <h4>Serviço</h4>
      <div class="field">
        <label>Tipo</label>
        <select v-model="service.type">
          <option v-for="(label, value) in SERVICE_TYPE_LABELS" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
      <div class="field">
        <label>Descrição</label>
        <input v-model="service.description" type="text" placeholder="Ex: post 3x por semana" />
      </div>
      <div class="field">
        <label>Início</label>
        <input v-model="service.started_at" type="date" />
      </div>

      <label class="checkbox-row">
        <input v-model="includePayment" type="checkbox" />
        Registrar primeiro pagamento
      </label>

      <template v-if="includePayment">
        <h4>Pagamento</h4>
        <div class="field">
          <label>Tipo</label>
          <select v-model="payment.type">
            <option v-for="(label, value) in PAYMENT_TYPE_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
        <div class="field">
          <label>Valor (R$)</label>
          <input v-model="payment.amount" type="number" step="0.01" min="0" />
        </div>
        <div class="field">
          <label>Data prevista</label>
          <input v-model="payment.due_date" type="date" />
        </div>
        <div class="field">
          <label>Já foi pago em</label>
          <input v-model="payment.paid_date" type="date" />
        </div>
      </template>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">Promover a cliente</button>
      </div>
    </form>
  </Modal>
</template>

<style scoped>
.promote-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.promote-intro {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}

.promote-form .error-text {
  margin: 0;
}

h4 {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  margin: 6px 0 -4px;
}
</style>
