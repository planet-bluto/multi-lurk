<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watchEffect } from 'vue'
import { Form } from '@primevue/forms'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
// import mini_player from './components/mini_player.vue'
import { addChannel, currentChannel, currentChannels } from './persist'
import Player from './components/Player.vue'
import { Keybinds } from './keybinds'

// const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
const mainContainer = useTemplateRef('mainContainer')
const mainPlayer = useTemplateRef('mainPlayer')
const othersContainer = useTemplateRef('othersContainer')

const chatWidth = ref(500)
const othersHeight = ref(100)

const popupVisible = ref(false)
const addStreamChannel = ref('')

var mounted = ref(false)
onMounted(() => {
  mounted.value = true
  player_resize()
  window.mainPlayer(currentChannel.value)
})

window.addEventListener('resize', player_resize)

var miniPlayerRes = ref({
  width: 0,
  height: 0
})
function player_resize(): void {
  let mainContainerEl: HTMLElement | null = mainContainer.value
  let othersContainerEl: HTMLElement | null = othersContainer.value
  let mainPlayerEl: HTMLElement | null = mainPlayer.value

  if (mainContainerEl != null && mainPlayerEl != null && othersContainerEl != null) {
    let player_res: object = { width: 0, height: 0 }
    mainPlayerEl.style.width = player_res['width'] + 'px'
    mainPlayerEl.style.height = player_res['height'] + 'px'

    // let windowSize = {
    //   width: window.outerWidth - 16,
    //   height: window.outerHeight - 16
    // }

    let main_res = {
      width: mainContainerEl.clientWidth,
      height: mainContainerEl.clientHeight
    }

    if (main_res.width > main_res.height) {
      player_res['width'] = main_res.width
      player_res['height'] = main_res.width * (9 / 16)
    } else {
      player_res['width'] = main_res.height * (16 / 9)
      player_res['height'] = main_res.height
    }

    miniPlayerRes.value.width = othersHeight.value * (16 / 9)
    miniPlayerRes.value.height = othersHeight.value

    console.log(player_res)

    mainPlayerEl.style.width = player_res['width'] + 'px'
    mainPlayerEl.style.height = player_res['height'] + 'px'
  }
}

Keybinds.bind("ctrl+t", (_event: KeyboardEvent) => {
  popupVisible.value = true
})

// const addStreamInput = useTemplateRef('addStreamInput')
function focusInput(): void {
  let addStreamInputEl: HTMLInputElement = (document.getElementById('addStreamInput') as HTMLInputElement)
  // console.log(addStreamInput)
  addStreamInputEl.value = ''
  addStreamInputEl?.focus()
  setTimeout(() => {
    if (addStreamInputEl != null) {
      addStreamInputEl.focus()
    }
  }, 500)
}

function newStreamDialog(): void {
  let addStreamInputEl: HTMLInputElement = (document.getElementById('addStreamInput') as HTMLInputElement)
  popupVisible.value = false
  addChannel(addStreamChannel.value)
  addStreamInputEl.value = ''
}

const playerContainer = useTemplateRef('playerContainer')
const leftSide = useTemplateRef('leftSide')
function setPlaterSize() {
  if (playerContainer.value != null && leftSide.value != null) {
    let leftSideRect = leftSide.value.getBoundingClientRect()
    playerContainer.value.style.setProperty('width', leftSideRect.width + 'px')
    print(leftSide.value.clientWidth + 'px')
    playerContainer.value.style.setProperty('height', leftSideRect.height + 'px')
    print(leftSide.value.clientHeight + 'px')
  }
}
watchEffect(setPlaterSize)
window.addEventListener('resize', setPlaterSize)
onMounted(setPlaterSize)

var draggingChatHandle = ref(false)
var draggingChatPos = ref([0, 0])
function startChatHandleDrag(_e: PointerEvent): void {
  draggingChatHandle.value = true
  draggingChatPos.value = [_e.clientX, _e.clientY]
  document.body.style.cursor = 'ew-resize'
}

var draggingOthersHandle = ref(false)
var draggingOthersPos = ref([0, 0])
function startOthersHandleDrag(_e: PointerEvent): void {
  draggingOthersHandle.value = true
  draggingOthersPos.value = [_e.clientX, _e.clientY]
  document.body.style.cursor = 'ew-resize'
}

document.body.addEventListener("pointermove", _e => {
  let current_pos = [_e.clientX, _e.clientY]
  
  let chat_start_pos = draggingChatPos.value
  if (draggingChatHandle.value) {
    let diff = chat_start_pos[0] - current_pos[0]
    chatWidth.value += diff
    setPlaterSize()
    draggingChatPos.value = current_pos
  }
  
  let others_start_pos = draggingOthersPos.value
  if (draggingOthersHandle.value) {
    let diff = others_start_pos[1] - current_pos[1]
    othersHeight.value += diff
    setPlaterSize()
    player_resize()
    draggingOthersPos.value = current_pos
  }
})

document.body.addEventListener("pointerup", _e => {
  draggingChatHandle.value = false
  draggingOthersHandle.value = false
  document.body.style.cursor = ''
})
</script>

<template>
  <Dialog v-model:visible="popupVisible" header="Add Stream" @show="focusInput">
    <Form @submit="newStreamDialog">
      <InputText id="addStreamInput" v-model="addStreamChannel" type="text" />
    </Form>
  </Dialog>
  <div id="whole" :style="`--chat-width: ${chatWidth}px; --others-height: ${othersHeight}px`">
    <div id="left" ref="leftSide">
      <div id="player-container" ref="playerContainer">
        <Player
          v-for="channel in currentChannels"
          :key="channel"
          :channel="channel"></Player>
      </div>
      <div id="main" ref="mainContainer">
        <!-- <iframe src="https://player.twitch.tv/?channel=gabarcode&parent=planet-bluto.net" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620"></iframe> -->
        <div id="main-transform" :class="currentChannel" ref="mainPlayer"></div>
      </div>
      <!-- <div id="others-handle" @pointerdown="startOthersHandleDrag"></div> -->
      <div
        id="others"
        ref="othersContainer"
        :style="`--child-width: ${miniPlayerRes.width}px; --child-height: ${miniPlayerRes.height}px`"
      >
        <div id="add-stream" class="widescreen" @click="popupVisible = true"></div>
        <div v-for="channel in currentChannels.filter((c: String) => c !== currentChannel)"
          :class="`widescreen ${channel}`"
          :id="`${channel}-transform`" >
          <!-- <p>{{ channel }}</p> -->
          <!-- <div class="dots-container">
            <div class="dot make-main-dot" @click="makeMain"></div>
            <div class="dot close-dot" @click="closePlayer"></div>
            <div class="dot reset-dot" @click="resetPlayer"></div>
          </div> -->
        </div>
      </div>
    </div>
    <div id="chat-handle" @pointerdown="startChatHandleDrag"></div>
    <div id="right">
      <div id="chat">
        <iframe
          v-for="channel in currentChannels"
          v-show="channel === currentChannel"
          id="chat_embed"
          :style="`pointer-events: ${draggingChatHandle ? 'none' : 'all'}`"
          :src="`https://www.twitch.tv/embed/${channel}/chat?parent=localhost&darkpopout`"
        >
        </iframe>
      </div>
    </div>
  </div>
</template>

<style lang="css">
#whole {
  display: flex;
  flex-direction: row;
  width: calc(100% - 16px);
  height: calc(100% - 16px);
  padding: 15px;
  gap: 12px;
}

#player-container {
  position: absolute;
  pointer-events: none;
  overflow: hidden;
}

#left {
  display: flex;
  flex-direction: column;
  width: calc(100% - var(--chat-width));
  height: 100%;
  gap: 12px;
}

#others-handle {
  width: 100%;
  height: 16px;
  background-color: #252525;
  border-radius: 5px;
}
#others-handle:hover { background-color: #353535; }

#chat-handle {
  width: 16px;
  height: 100%;
  background-color: #252525;
  border-radius: 5px;
}
#chat-handle:hover { background-color: #353535; }

#right {
  width: var(--chat-width);
  height: 100%;
}

#main {
  display: flex;
  width: 100%;
  max-width: 100%;
  min-width: 100%;
  height: 100%;
  max-height: 100%;
  max-height: 100%;
  /* background-color: #f003; */
  /* background-color: #0d0d0d; */
  justify-content: center;
  align-items: center;
}

/* #main-player {
  background-color: #f0f3;
} */

#main-player > iframe {
  width: 100%;
  height: 100%;
  border-radius: 5px;
}

#others {
  display: flex;
  width: 100%;
  max-width: 100%;
  min-width: 100%;
  height: calc(var(--others-height) + 30px);
  padding-bottom: 30px;
  gap: 15px;
  overflow-x: scroll;
  overflow-y: hidden;
  /* background-color: #0f03; */
}

/* SCROLL BARS */

/* width */
#others::-webkit-scrollbar {
 width: 10px;
 height: 10px;
  border-radius: 10px;
}

/* Track */
#others::-webkit-scrollbar-track {
  background: #0000001c;
  border-radius: 10px;
}
  
/* Handle */
#others::-webkit-scrollbar-thumb {
  background: #252525;
  border-radius: 10px;
}

#others::-webkit-scrollbar-corner {
  background: #0000001c;
  border-radius: 10px;
}

#others > * > iframe {
  width: 100%;
  height: 100%;
}

.widescreen {
  width: var(--child-width);
  min-width: var(--child-width);
  max-width: var(--child-width);
  height: var(--child-height);
  min-height: var(--child-height);
  max-height: var(--child-height);
  /* background-color: #252525; */
  border-radius: 5px;
}

#chat {
  z-index: 100;
  width: 100%;
  height: 100%;
  /* background-color: #00f3; */
}

#chat > iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 5px;
  /* background-color: #00f3; */
}
</style>
