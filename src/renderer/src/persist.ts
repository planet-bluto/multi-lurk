import { Ref, ref, watchEffect } from 'vue'
import { Keybinds } from './keybinds'

export const currentChannel: Ref<string> = ref(localStorage.getItem('currentChannel') || '')
export const currentChannels: Ref<string[]> = ref(localStorage.getItem('currentChannels') ? JSON.parse(localStorage.getItem('currentChannels') || '[]') : [])
watchEffect(() => {
  localStorage.setItem('currentChannel', currentChannel.value)
  localStorage.setItem('currentChannels', JSON.stringify(currentChannels.value))
})

export function addChannel(channel: string): void {
  channel = channel.toLowerCase()
  if (!currentChannels.value.includes(channel)) {
    currentChannels.value.push(channel)
  }
}
export function removeChannel(channel: string): void {
  channel = channel.toLowerCase()
  // currentChannels.value = currentChannels.value.filter(c => c !== channel)
  let ind = currentChannels.value.indexOf(channel)
  if (ind > -1) {
    currentChannels.value.remove(ind)
    if (currentChannel.value === channel) {
      currentChannel.value = currentChannels.value[0] || ''
    }
  }
}

export const zoomLevel: Ref<number> = ref(parseInt(localStorage.getItem('zoomLevel') || '0.8'))
watchEffect(() => {
  window.electron.webFrame.setZoomFactor(zoomLevel.value)
  localStorage.setItem('zoomLevel', zoomLevel.value.toString())
})

Keybinds.bind("alt+=", (_event: KeyboardEvent) => {
  zoomLevel.value += 0.05
  print("Zoom Level: ", zoomLevel.value)
})

Keybinds.bind("alt+-", (_event: KeyboardEvent) => {
  zoomLevel.value -= 0.05
  print("Zoom Level: ", zoomLevel.value) 
})