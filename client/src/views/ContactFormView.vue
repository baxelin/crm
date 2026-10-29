<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { contactsApi } from '../api'
import { useRequest } from '../composables/useRequest'
import { CONTACT_STATUS_LABELS } from '../constants/labels'
import { todayISO } from '../utils/format'

const props = defineProps({
  id: { type: [String, Number], default: null },
})

const router = useRouter()
const isEdit = computed(() => Boolean(props.id))
const form = ref(emptyForm())
const { loading, error, run } = useRequest()

function emptyForm() {
  return {
    name: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    status: 'lead',
    origin: '',
    first_contact_date: todayISO(),
    last_contact_date: '',
    notes: '',
  }
}

function toForm(contact) {
  return Object.fromEntries(Object.keys(emptyForm()).map((field) => [field, contact[field] ?? '']))
}

async function load() {
  if (!isEdit.value) return
  await run(async () => {
    form.value = toForm(await contactsApi.get(props.id))
  })
}

async function submit() {
  if (!form.value.name.trim()) {
    error.value = 'Nome é obrigatório'
    return
  }
  await run(async () => {
    const contact = isEdit.value
      ? await contactsApi.update(props.id, form.value)
      : await contactsApi.create(form.value)
    router.push(`/contatos/${contact.id}`)
  })
}

onMounted(load)
</script>

<template>
  <div class="page narrow">
    <div class="page-header">
      <div>
        <div class="page-eyebrow">{{ isEdit ? 'Editar contato' : 'Novo contato' }}</div>
        <h1>{{ isEdit ? form.name || 'Editar' : 'Novo lead' }}</h1>
      </div>
      <button class="btn btn-ghost" @click="router.back()">Cancelar</button>
    </div>

    <form class="card form-card" @submit.prevent="submit">
      <p v-if="error" class="error-text">{{ error }}</p>

      <div class="grid-2">
        <div class="field">
          <label>Nome</label>
          <input v-model="form.name" type="text" required placeholder="Nome do lead/cliente" />
        </div>
        <div class="field">
          <label>Status</label>
          <select v-model="form.status">
            <option v-for="(label, value) in CONTACT_STATUS_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
      </div>

      <div class="grid-2">
        <div class="field">
          <label>Telefone</label>
          <input v-model="form.phone" type="tel" placeholder="11987654321" />
        </div>
        <div class="field">
          <label>E-mail</label>
          <input v-model="form.email" type="email" placeholder="contato@exemplo.com" />
        </div>
      </div>

      <div class="field">
        <label>Endereço</label>
        <input v-model="form.address" type="text" placeholder="Rua, número, bairro, cidade" />
      </div>

      <div class="grid-2">
        <div class="field">
          <label>Website</label>
          <input v-model="form.website" type="text" placeholder="exemplo.com.br" />
        </div>
        <div class="field">
          <label>Origem</label>
          <input v-model="form.origin" type="text" placeholder="Indicação, Instagram, site..." />
        </div>
      </div>

      <div class="grid-2">
        <div class="field">
          <label>Primeiro contato</label>
          <input v-model="form.first_contact_date" type="date" />
        </div>
        <div v-if="isEdit" class="field">
          <label>Último contato</label>
          <input v-model="form.last_contact_date" type="date" />
        </div>
      </div>

      <div class="field">
        <label>Observações</label>
        <textarea v-model="form.notes" placeholder="Notas gerais sobre o contato"></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ isEdit ? 'Salvar alterações' : 'Criar contato' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.page.narrow {
  max-width: 680px;
}
</style>
