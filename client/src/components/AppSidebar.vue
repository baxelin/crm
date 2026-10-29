<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark">C</span>
      <div class="brand-text">
        <strong>CRM</strong>
        <span>Gestão de clientes</span>
      </div>
    </div>

    <nav class="nav">
      <RouterLink to="/" class="nav-link" exact-active-class="active">
        <svg viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="13" rx="2.5" stroke="currentColor" stroke-width="1.4" />
          <path d="M3 8H17" stroke="currentColor" stroke-width="1.4" />
          <path d="M7 2.5V5.5M13 2.5V5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        </svg>
        <span>Dashboard</span>
      </RouterLink>

      <RouterLink to="/contatos" class="nav-link" active-class="active">
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.4" />
          <path d="M3.5 17c0-3.038 2.91-5.5 6.5-5.5s6.5 2.462 6.5 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        </svg>
        <span>Contatos</span>
      </RouterLink>

      <RouterLink to="/financas" class="nav-link" active-class="active">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M3 15.5 7.5 10l3 3 6-6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M13.5 6h3v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M3 17.5h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        </svg>
        <span>Finanças</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 232px;
  flex-shrink: 0;
  background: var(--color-bg-alt);
  border-right: 1px solid var(--color-border-soft);
  display: flex;
  flex-direction: column;
  padding: 28px 18px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 8px;
  margin-bottom: 40px;
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-accent);
  color: #fff8f2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 17px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-text strong {
  font-family: var(--font-display);
  font-size: 16.5px;
  font-weight: 700;
}

.brand-text span {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav-link svg {
  width: 19px;
  height: 19px;
  flex-shrink: 0;
}

.nav-link:hover {
  background: var(--color-surface);
  color: var(--color-text);
}

.nav-link.active {
  background: var(--color-surface-raised);
  color: var(--color-accent);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}
</style>
