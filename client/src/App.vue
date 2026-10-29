<script setup>
import AppSidebar from './components/AppSidebar.vue'
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  min-width: 0;
}
</style>
