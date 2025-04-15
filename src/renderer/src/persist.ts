import { Ref, ref, watchEffect } from 'vue'
import { Keybinds } from './keybinds'
// import { useToast } from 'primevue'

function updateDocumentTitle() {
  document.title = `MultiLurk${currentChannel.value != "" ? ` - ${currentChannel.value}${(currentChannels.value.length-1) > 0 ? ` (+${(currentChannels.value.length-1)})` : ""}` : ""}`
}

export const currentChannel: Ref<string> = ref(localStorage.getItem('currentChannel') || '')
export const currentChannels: Ref<string[]> = ref(localStorage.getItem('currentChannels') ? JSON.parse(localStorage.getItem('currentChannels') || '[]') : [])
export const raidedChannels: Ref<string[]> = ref([])
watchEffect(() => {
  localStorage.setItem('currentChannel', currentChannel.value)
  localStorage.setItem('currentChannels', JSON.stringify(currentChannels.value))
  
  if (!currentChannels.value.every((c, i) => (currentChannels.value.indexOf(c) == i))) {
    currentChannels.value = [...new Set(currentChannels.value)]
  }
  
  updateDocumentTitle()
})

export function mainChannel(channel: string): void {
  channel = channel.toLowerCase()
  currentChannel.value = channel
  window.mainPlayer(channel)

  updateDocumentTitle()
}

// const toast = useToast();
export function addChannel(channel: string, makeMain: boolean = true): void {
  channel = channel.toLowerCase()
  if (!currentChannels.value.includes(channel)) {
    currentChannels.value.push(channel)

    if (makeMain || currentChannels.value.length == 1) {
      mainChannel(channel)
    }

    nonFollowedCheck()
  } else {
    // window.toast({ severity: 'warn', summary: 'Channel already added', detail: `Channel ${channel} is already in the list`, life: 3000 })
    if (makeMain) { mainChannel(channel) } else {
      window.toast({ severity: 'error', summary: "Channel Not Added", detail: 'You can only add one instance of a channel!', group: 'main', life: 3000 })
    }
  }

  updateDocumentTitle()
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
      if (currentChannels.value[0] != null) {
        mainChannel(currentChannels.value[0])
      } else {
        currentChannel.value = ""
      }
    }
  }

  updateDocumentTitle()
}

Keybinds.bind("alt+shift+w", (_e) => {
  let amount = currentChannels.value.length
  for (let index = 0; index < amount; index++) {
    const channel = currentChannels.value[0];
    removeChannel(channel) 
  }
})

export function replaceChannel(oldChannel: string, newChannel: string) {
  print("CHANNELS: ", currentChannels.value)
  if (currentChannels.value.includes(newChannel)) {
    if (currentChannel.value == oldChannel) {
      mainChannel(newChannel)
    }
  } else {
    currentChannels.value = currentChannels.value.join(",").replace(oldChannel, newChannel).split(",")
    window.playerRemoved(oldChannel)
    channelCache.value = channelCache.value.filter(c => c.name != oldChannel)
  }
  
  if (currentChannel.value == oldChannel) {
    mainChannel(newChannel)
  }

  updateDocumentTitle()
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

export const zoomLevel: Ref<number> = ref(Number(localStorage.getItem('zoomLevel') || '0.8'))
const updateZoom = (() => {
  zoomLevel.value = clamp(zoomLevel.value, 0.25, 5.0)
  print("Zoom Level: ", zoomLevel.value) 
  if (window.electron != null) { window.electron.webFrame.setZoomFactor(zoomLevel.value) }
  localStorage.setItem('zoomLevel', zoomLevel.value.toString())
})

updateZoom()

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

Keybinds.bind("alt+=", (_event: KeyboardEvent) => {
  zoomLevel.value += 0.02
  updateZoom()
})

Keybinds.bind("alt+-", (_event: KeyboardEvent) => {
  zoomLevel.value -= 0.02
  updateZoom()
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