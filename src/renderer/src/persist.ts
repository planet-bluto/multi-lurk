import { Ref, ref, watchEffect } from 'vue'
import { Keybinds } from './keybinds'
// import { useToast } from 'primevue'

export const currentChannel: Ref<string> = ref(localStorage.getItem('currentChannel') || '')
export const currentChannels: Ref<string[]> = ref(localStorage.getItem('currentChannels') ? JSON.parse(localStorage.getItem('currentChannels') || '[]') : [])
watchEffect(() => {
  localStorage.setItem('currentChannel', currentChannel.value)
  localStorage.setItem('currentChannels', JSON.stringify(currentChannels.value))
})

export function mainChannel(channel: string): void {
  channel = channel.toLowerCase()
  currentChannel.value = channel
  window.mainPlayer(channel)
}

// const toast = useToast();
export function addChannel(channel: string, makeMain: boolean = false): void {
  channel = channel.toLowerCase()
  if (!currentChannels.value.includes(channel)) {
    currentChannels.value.push(channel)

    if (makeMain || currentChannels.value.length == 1) {
      mainChannel(channel)
    }

    nonFollowedCheck()
  } else {
    // window.toast({ severity: 'warn', summary: 'Channel already added', detail: `Channel ${channel} is already in the list`, life: 3000 })
    window.toast({ severity: 'error', summary: "Channel Not Added", detail: 'You can only add one instance of a channel!', group: 'br', life: 3000 })
  }
}
export function removeChannel(channel: string): void {
  channel = channel.toLowerCase()
  // currentChannels.value = currentChannels.value.filter(c => c !== channel)
  let ind = currentChannels.value.indexOf(channel)
  if (ind > -1) {
    currentChannels.value.remove(ind)
    channelCache.value = channelCache.value.filter(c => c.name != channel)

    window.playerRemoved(channel)

    if (currentChannel.value === channel) {
      currentChannel.value = currentChannels.value[0] || ''
    }
  }
}

function nonFollowedCheck() {
  currentChannels.value.forEach(channelName => {
    let foundChannel = followingChannels.value.find(c => c.name == channelName)
    let miscChannel = channelCache.value.find(c => c.name == channelName)
    if (miscChannel == null && foundChannel == null) {
      window.electron.ipcRenderer.invoke('get-channel', channelName).then(channelObj => {
        print(channelObj)
        channelCache.value.push(channelObj)
      })
    }
  })
}

export const zoomLevel: Ref<number> = ref(parseInt(localStorage.getItem('zoomLevel') || '0.8'))
watchEffect(() => {
  if (window.electron != null) { window.electron.webFrame.setZoomFactor(zoomLevel.value) }
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

export const followingChannels: Ref<any[]> = ref([])
if (window.electron != null) {
  window.electron.ipcRenderer.on('following_channels', (_event, channels: string[]) => {
    followingChannels.value = channels
    console.log("Following Channels: ", channels)
    nonFollowedCheck()
    // localStorage.setItem('followingChannels', JSON.stringify(channels))
  })
}

export const channelCache: Ref<any[]> = ref([])