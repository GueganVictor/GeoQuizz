import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Dev-only handle for the headless card engine (Slice 2). Lets the session runner
// (Slice 3) and manual testing drive the store from the console; stripped in prod.
if (import.meta.env.DEV) {
  void import('./stores/session').then(({ useSessionStore }) => {
    ;(window as Window & { __session?: unknown }).__session = useSessionStore()
  })
}
