<script setup lang="ts">
import { onMounted, provide, Ref, ref, triggerRef, useTemplateRef, watchEffect } from 'vue'
import { Form } from '@primevue/forms'
import Dialog from 'primevue/dialog'
import Popover from 'primevue/popover';
import Toast, { ToastMessageOptions } from 'primevue/toast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext'
// import mini_player from './components/mini_player.vue'
import { addChannel, channelCache, currentChannel, currentChannels, followingChannels } from './persist'
import Player from './components/Player.vue'
import { Keybinds } from './keybinds'
import { useToast } from 'primevue';

import add_button_image from './assets/add_button.png'
import side_icon_image from './assets/side_icon.png'
import side_icon_eye_image from './assets/side_icon_eye.png'
// console.log(add_button_image)

const toast = useToast()

// const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
const mainContainer = useTemplateRef('mainContainer')
const mainPlayer = useTemplateRef('mainPlayer')
const othersContainer = useTemplateRef('othersContainer')

const chatWidth = ref(500)
const othersHeight = ref(100)

const startupPopupVisible = ref(localStorage.getItem("access_token") == null)

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
provide("draggingChatHandle", draggingChatHandle)

var draggingOthersHandle = ref(false)
var draggingOthersPos = ref([0, 0])
// function startOthersHandleDrag(_e: PointerEvent): void {
//   draggingOthersHandle.value = true
//   draggingOthersPos.value = [_e.clientX, _e.clientY]
//   document.body.style.cursor = 'ew-resize'
// }

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

function handleIframeLoad(id) {
  // let iframe: HTMLIFrameElement = (e.target as HTMLIFrameElement)
  let webView: any = document.getElementById(id)
  webView.executeJavaScript(`function ffz_init()
      {
        var script = document.createElement('script');
      
        script.id = 'ffz_script';
        script.type = 'text/javascript';
        script.src = '//cdn2.frankerfacez.com/script/script.min.js?_=' + Date.now();
      
        if ( localStorage.ffzDebugMode == "true" ) {
          // Developer Mode is enabled. But is the server running? Check before
          // we include the script, otherwise someone could break their
          // experience and not be able to recover.
          var xhr = new XMLHttpRequest();
          xhr.open("GET", "//localhost:8000/dev_server", true);
          xhr.onload = function(e) {
            var resp = JSON.parse(xhr.responseText);
            console.log("FFZ: Development Server is present. Version " + resp.version + " running from: " + resp.path);
            script.src = "//localhost:8000/script/script.js?_=" + Date.now();
            document.body.classList.add("ffz-dev");
            document.head.appendChild(script);
          };
          xhr.onerror = function(e) {
            console.log("FFZ: Development Server is not present. Using CDN.");
            document.head.appendChild(script);
          };
          return xhr.send(null);
        }
      
        document.head.appendChild(script);
      }
      
      ffz_init();`)
  // if (window.electron) { window.electron.ipcRenderer.send('iframe-loaded', {id: id, url: webView.src}) }
}

function showWebView(channel) {
  return ((window.electron != null) && channel == currentChannel.value)
}

function showIframe(channel) {
  return ((window.electron == null) && channel == currentChannel.value)
}

function getHost() {
  return window.location.host
}

const showRing = ref(false)


const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
// const DAY = HOUR * 24

// const WEEK = DAY * 7
// const MONTH = DAY * 30
// const YEAR = DAY * 365

function parseDuration(duration: number) {
    let hours = Math.floor(duration / HOUR)
    let remainder = duration - (hours * HOUR)
    let minutes = Math.floor(remainder / MINUTE)
    let seconds = Math.floor((duration - (hours * HOUR) - (minutes * MINUTE)) / SECOND)
    let milliseconds = (duration - (hours * HOUR) - (minutes * MINUTE) - (seconds * SECOND))

    return {hours, minutes, seconds, milliseconds}
}

function parseDurationString(duration: number, include_seconds = false) {
    let parsedDuration = parseDuration(duration)

    return String(parsedDuration.hours).padStart(2, "0") + ":" + String(parsedDuration.minutes).padStart(2, "0") + (include_seconds ? ":" + String(parsedDuration.seconds).padStart(2, "0") : "")
}

const streamCard = useTemplateRef('stream-card')
const cardChannel: Ref<any | null> = ref(null)

const cardChannelTimestamp = ref("")
var timestampInt: any = null
async function showStreamCard(event, channel) {
  if (typeof(channel) == "string") {
    let foundChannel = followingChannels.value.find(c => c.name == channel)
    // print(foundChannel)
    if (foundChannel == null) {
      foundChannel = channelCache.value.find(c => c.name == channel)
    }

    channel = foundChannel

    print(channel)
  }
  if (timestampInt) { clearInterval(timestampInt) }

  cardChannel.value = channel
  if (channel.streaming) {
    const updateTimestamp = () => {
      cardChannelTimestamp.value = parseDurationString(Date.now() - channel.startTime, true)
      triggerRef(cardChannelTimestamp)
    }
    timestampInt = setInterval(updateTimestamp, 1000)
    updateTimestamp()
  }

  streamCard.value?.show(event)
    try {
      streamCard.value?.alignOverlay()
    } catch (e) {
      // yo I don't fucking caree
      // console.error("kill all vue contributors kill all vue contributors kill all vue contributors kill all vue contributors kill all vue contributors kill all vue contributors kill all vue contributors kill all vue contributors kill all vue contributors: ", e)
      1 // the number 1 :)
    }
}
provide("showStreamCard", showStreamCard)

function hideStreamCard() {
  streamCard.value?.hide()
}
provide("hideStreamCard", hideStreamCard)

function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}


const sidebar = useTemplateRef('sidebar')
onMounted(() => {
  sidebar.value?.addEventListener('scroll', (_e) => {
    streamCard.value?.alignOverlay()
  })
})

const sidebarInner = useTemplateRef('sidebarInner')
var scrollValue = 0

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

onMounted(() => {
  sidebarInner.value?.addEventListener('wheel', (_e: WheelEvent) => {
    print(_e.deltaY)
    scrollValue += (_e.deltaY)

    scrollValue = clamp(scrollValue, 0, sidebarInner.value?.scrollHeight)
  })
})
function lerpToScroll() {
  if (sidebarInner.value) {
    sidebarInner.value.scrollTop = lerp(sidebarInner.value.scrollTop, scrollValue, 0.2)
  }
  requestAnimationFrame(lerpToScroll)
}
lerpToScroll()

window.toast = (arg: ToastMessageOptions) => {
  print("erm: ", arg)
  toast.add(arg)
}

function initiateLogin() {
  window.electron.ipcRenderer.send('login')
}

function initiateLogout() {
  localStorage.removeItem("access_token")
  location.reload()
}

function tokenStored() {
  return localStorage.getItem("access_token") != null
}


var sideIconEye = useTemplateRef('sideIconEye')
var eyeAng = 0
var eyeAngTarget = 0
document.body.addEventListener("mousemove", e => {
  let elem = sideIconEye.value
  if (elem != null) {
    eyeAngTarget = Math.atan2(
      e.clientX - (elem.offsetTop + (elem.offsetHeight / 2)),
      e.clientY - (elem.offsetLeft + (elem.offsetWidth / 2))
    )

  }
})
function moveEyeToAngle() {
  let elem = sideIconEye.value
  if (elem != null) {
  eyeAng = lerpAngle(eyeAng, eyeAngTarget, 0.1)
  elem.style.setProperty("rotate", `-${radToDeg(eyeAng)}deg`)
  }
  requestAnimationFrame(moveEyeToAngle)
}
moveEyeToAngle()

function radToDeg(radians) {
  return radians * (180 / Math.PI)
}

function lerpAngle(start, end, t) {
  let diff = end - start
  if (diff > Math.PI) {
    diff -= Math.PI * 2
  } else if (diff < -Math.PI) {
    diff += Math.PI * 2
  }
  return start + diff * t
}
</script>

<template>
  <Toast position="bottom-left" group="bl" />
  <Dialog v-model:visible="popupVisible" header="Add Stream" @show="focusInput">
    <Form @submit="newStreamDialog">
      <InputText id="addStreamInput" v-model="addStreamChannel" type="text" />
    </Form>
  </Dialog>
  <Popover ref="stream-card">
    <div id="stream-card-inner">
      <p id="stream-card-channel">{{ cardChannel?.display_name }}<span v-show="cardChannel.streaming" id="stream-card-game"> • {{ cardChannel.game }}</span></p>
      <!-- <p v-show="cardChannel?.streaming" id="stream-card-viewcount">{{ cardChannel?.viewers }}</p> -->
      <div id="stream-card-timestamp"><div id="stream-card-timestamp-live-dot" :style="`background-color: #${cardChannel.streaming ? 'ff2929' : '353535'}`"></div><p id="stream-card-timestamp-text">{{ (cardChannel?.streaming ? cardChannelTimestamp : "OFFLINE") }} <span style="opacity: 0.5 ;">|</span> {{ cardChannel?.viewers }} viewers</p></div>
      <p v-show="cardChannel?.streaming" id="stream-card-title">{{ cardChannel?.title }}</p>
    </div>
  </Popover>
  <Dialog v-model:visible="startupPopupVisible" header="MultiLurk!">
    <p style="font-size: 18px; margin-bottom: 15px;">Welcome to <span style="color: #782ce9; font-weight: bold;">MultiLurk</span>! A Twitch client for watching, switching between, and keeping up with multiple streams at once!</p>
    <div style="display: flex; gap: 15px">
      <Button label="Login With Twitch!" severity="info" @click="initiateLogin"></Button>
      <Button label="Logout" severity="danger" v-show="tokenStored" @click="initiateLogout"></Button>
    </div>
  </Dialog>
  <div id="sidebar" ref="sidebar">
    <img id="side-icon" :src="side_icon_image" @click="startupPopupVisible = true"></img>
    <img id="side-icon-eye" :src="side_icon_eye_image" @click="startupPopupVisible = true" ref="sideIconEye"></img>
    <div id="sidebar-inner" ref="sidebarInner">
      <div v-for="channel in followingChannels.toSorted((a, b) => { return ((Date.now() - a.startTime) - (Date.now() - b.startTime)) })" @click="addChannel(channel.name)" @mouseover="event => showStreamCard(event, channel)" @mouseleave="hideStreamCard">
        <img class="sidebar-icon" :src="channel.picture" :style="`--ring-color: #${showRing ? (channel.streaming ? 'ff2929' : '353535') : '151515'}`"></img>
        <div class="sidebar-dot-container">
          <div class="sidebar-dot" :style="`--dot-color: #${(channel.streaming ? 'ff2929' : '353535')}`" v-show="!showRing"></div>
        </div>
      </div>
    </div>
  </div>
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
        <img id="add-stream" :flashing="currentChannels.length == 0" class="widescreen" @click="popupVisible = true" :src="add_button_image"></img>
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
        <webview
          v-for="channel in currentChannels"
          v-show="showWebView(channel)"
          class="chat-embed"
          :id="`${channel}_chat_embed`"
          :style="`pointer-events: ${draggingChatHandle ? 'none' : 'all'}`"
          :src="`https://www.twitch.tv/popout/${channel}/chat`"
          @did-finish-load="handleIframeLoad(`${channel}_chat_embed`)"
          allowpopups
        >
        </webview>
        <iframe
          v-for="channel in currentChannels"
          v-show="showIframe(channel)"
          class="chat-embed"
          :id="`${channel}_chat_embed`"
          :style="`pointer-events: ${draggingChatHandle ? 'none' : 'all'}`"
          :src="`https://www.twitch.tv/embed/${channel}/chat?parent=${getHost()}&darkpopout`"
          @did-finish-load="handleIframeLoad(`${channel}_chat_embed`)"
          allowpopups
        >
        </iframe>
      </div>
    </div>
  </div>
</template>

<style lang="css">
p {
  margin: 0;
  padding: 0;
}

#stream-card-inner {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

#stream-card-channel {
  font-weight: bold;
  font-size: 20px;
}

#stream-card-game {
  font-weight: normal;
  /* color: #aaa; */
  opacity: 0.5;
}

#stream-card-viewcount {
  font-size: 18px;
  font-weight: bold;
  /* color: #aaa; */
  opacity: 0.5;
}

#stream-card-timestamp {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
}
#stream-card-timestamp-text {
  font-size: 18px;
  font-weight: bold;
  /* color: #aaa; */
  opacity: 0.5;
}

#stream-card-timestamp-live-dot {
  width: 10px;
  height: 10px;
  /* background-color: #ff2929; */
  border-radius: 50%;
}

#stream-card-title {
  font-size: 18px;
  font-weight: normal;
  /* color: #aaa; */
  opacity: 0.5;
}

#whole {
  display: flex;
  flex-direction: row;
  width: calc(100% - 16px - 64px);
  height: calc(100% - 16px);
  padding: 15px;
  gap: 12px;
}

#player-container {
  position: absolute;
  pointer-events: none;
  overflow: hidden;
}

#sidebar {
  width: calc(64px + 10px);
  height: 100%;
  background-color: #252525;
}

#side-icon {
  position: relative;
  width: 100%;
  height: auto;
  /* margin-bottom: 12px; */
  z-index: 10;
}

#side-icon-eye {
  position: absolute;
  width: 64px;
  height: 64px;
  top: 12px;
  left: 6px;
  z-index: 100;
}

#sidebar-inner {
  width: 100%;
  height: 100%;
  padding: 5px;
  /* padding-right: 10px; */
  overflow-y: hidden;
  overflow-x: hidden;
  /* border-radius: 5px; */
  padding-top: 79px;
  margin-top: -79px;
}

/* SCROLL BARS */

/* width */
#sidebar-inner::-webkit-scrollbar {
  /* position: relative; */
  /* left: -5px; */
  /* margin-left: -5px; */
  width: 5px;
  height: 10px;
  border-radius: 10px;
}

/* Track */
#sidebar-inner::-webkit-scrollbar-track {
  /* background: #0000001c; */
  border-radius: 10px;
  /* width: 20px; */
}
  
/* Handle */
#sidebar-inner::-webkit-scrollbar-thumb {
  background: #353535;
  border-radius: 10px;
}

#sidebar-inner::-webkit-scrollbar-corner {
  background: #0000001c;
  border-radius: 10px;
}

.sidebar-icon {
  width: 100%;
  height: auto;
  border-radius: 50%;
  border: var(--ring-color) 5px solid;
  /* margin-bottom: 12px; */
}

.sidebar-dot-container {
  width: 0px;
  height: 0px;
}

.sidebar-dot {
  position: relative;
  top: -25px;
  left: calc(-20px + (54px));
  width: 25px;
  height: 25px;
  background-color: var(--dot-color);
  border: 5px solid #252525;
  border-radius: 50%;
  /* cursor: pointer; */
  /* pointer-events: all; */
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

.chat-embed {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 5px;
  pointer-events: all;
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

#add-stream {
  background-size: 100% 100%;
  object-fit: cover;
}
#add-stream:hover {
  filter: brightness(1.5);
  transition: filter 0.2s ease-out;
}
#add-stream[flashing=true] {
  animation: flashing 0.5s infinite alternate;
  transition: none;
}

@keyframes flashing {
  0% { filter: brightness(1.5); }
  100% { filter: brightness(1); }
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
