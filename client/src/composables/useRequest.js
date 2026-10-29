import { ref } from 'vue'

export function useRequest(initialLoading = false) {
  const loading = ref(initialLoading)
  const error = ref('')

  async function run(request) {
    loading.value = true
    error.value = ''
    try {
      await request()
      return true
    } catch (e) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  return { loading, error, run }
}
