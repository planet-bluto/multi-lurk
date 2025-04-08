import './assets/style.css'

import "./arrayLib.js"

import "./extends/array"
// import "./extends/date"
import "./extends/print"
import "./extends/epoch"

import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import App from './App.vue'
import { addChannel } from './persist'
import { Keybinds } from './keybinds'

Keybinds.bind("ctrl+shift+f", (_event: KeyboardEvent) => {
  console.log("Keybinds: ", _event.key, _event.ctrlKey, _event.shiftKey, _event.altKey)
  console.log("BLAH")
})

const app = createApp(App)
app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
})
app.mount('#app')

window.electron.ipcRenderer.on('access_token', (_event, token: string) => {
  console.log("Got Access Token: ", token)
  window.localStorage.setItem("access_token", token)
  window.location.reload()
})

window.electron.ipcRenderer.on('add_channel', (_event, channel: any) => {
  addChannel(channel.name)
})