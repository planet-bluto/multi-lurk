<script setup lang="ts">
import { currentChannel, mainChannel, removeChannel } from '../persist'
import { computed, inject, onMounted, onUpdated, ref, useTemplateRef, watch } from 'vue'

const props = defineProps({
  channel: {
    type: String,
    required: true,
  }
})

const elemId = computed(() => {
  return `${props.channel}-player`
})

onMounted(() => {
  window.setPlayer(props.channel, false)
})


onUpdated(() => {
  window.setPlayer(props.channel, false)
})

function makeMain(_e: MouseEvent): void {
  mainChannel(props.channel)
}

function closePlayer(_e: MouseEvent): void {
  removeChannel(props.channel)
}

// function resetPlayer(_e: MouseEvent): void {
//   window.setPlayer(props.channel, false)
// }

function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

var thisElem = useTemplateRef("thisElem")
var clickableElem = useTemplateRef("clickableElem")
const LERPFPS = 60
function movetoTransform() {
  var player_transform = document.getElementsByClassName(props.channel)[0] as HTMLElement
  const its = ["Top", "Left", "Width", "Height"]
  
  function center(rect: {top: number, left: number, width: number, height: number}) {
    return {
      top: rect.top + (rect.height / 2),
      left: rect.left + (rect.width / 2),
      width: rect.width,
      height: rect.height
    }
  }

  function uncenter(rect: {top: number, left: number, width: number, height: number}) {
    return {
      top: rect.top - (rect.height / 2),
      left: rect.left - (rect.width / 2),
      width: rect.width,
      height: rect.height
    }
  }

  let thisRect: any = {}
  let elems = [clickableElem, thisElem]
  its.forEach((it, ind) => {
    let offset = ind < 2 ? 60 : 0
    if (thisElem.value != null) {
      let current = center(thisElem.value.getBoundingClientRect())[it.toLowerCase()]

      elems.forEach((elem) => {
        if (elem.value == null) return
        
        thisRect[it.toLowerCase()] = lerp(
          current,
          (center(player_transform.getBoundingClientRect())[it.toLowerCase()] - offset),
          (ind < 2 ? 0.25 : 0.1)
        )
      })
    }
  })

  const offsets = [0, -74, 0, 0]
  elems.forEach((elem) => {
    let actualRect = uncenter(thisRect)
    Object.keys(actualRect).forEach((it, ind) => {
      if (elem.value == null) { return }
      elem.value.style[it] = (actualRect[it] + offsets[ind]) + "px"
    })
  })

  setTimeout(movetoTransform, (1000 / LERPFPS))
}
movetoTransform()


const draggingChatHandle = inject("draggingChatHandle", ref(false))
function updateStyle() {
  if (thisElem.value) {
    let res = ((currentChannel.value).toLowerCase() == props.channel.toLowerCase() && !draggingChatHandle.value) ? 'all' : 'none'
    print(res)
    thisElem.value.style.setProperty("--pointings", res)
  }
}
watch(currentChannel, updateStyle)
watch(draggingChatHandle, updateStyle)
// onUpdated(movetoTransform)

const showStreamCard = inject("showStreamCard", (_e: MouseEvent, _c: any) => {})
const hideStreamCard = inject("hideStreamCard", (_e: MouseEvent) => {})

const hovering = ref(false)
</script>

<template>
  <div :id="elemId" class="floating-player" ref="thisElem" @mouseover="hovering = true" @mouseleave="hovering = false">
    <div class="floating-player-clickable-container">
      <div class="floating-player-clickable" ref="clickableElem" @mouseover="e => {if (currentChannel != props.channel) {showStreamCard(e, props.channel)}}" @mouseleave="hideStreamCard" @click="makeMain" v-show="currentChannel != props.channel"></div>
    </div>
    <div v-show="(hovering)" class="dots-container">
      <!-- <div class="dot make-main-dot" @click="makeMain"></div> -->
      <div class="dot close-dot" @click="closePlayer"></div>
      <!-- <div class="dot reset-dot" @click="resetPlayer"></div> -->
    </div>
  </div>
</template>

<style>
.floating-player {
  position: absolute;
  border-radius: 5px;
  --pointings: none;
}

.floating-player-clickable-container {
  width: 0px;
  height: 0px;
}

.floating-player-clickable {
  top: 0px !important;
  left: 0px !important;
  position: relative;
  /* z-index: 1; */
  background-color: #fff;
  opacity: 0;
  pointer-events: all;
}
.floating-player-clickable:hover {
  background-color: #fff;
  opacity: 0.1;
  transition: all 0.2s ease-out;
}

.floating-player > iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  pointer-events: var(--pointings);
}

.dots-container {
  width: 0px;
  height: 0px;
}


.dot {
  position: relative;
  top: -15px;
  right: 15px;
  width: 30px;
  height: 30px;
  background-color: #252525;
  border: 5px solid #151515;
  border-radius: 50%;
  cursor: pointer;
  pointer-events: all;
}
.dot:hover {
  filter: brightness(1.5);
  transition: all 0.2s ease-out;
}

.make-main-dot { background-color: #024aca;}
.close-dot { background-color: #e03c28;}
.reset-dot { background-color: #ffbb31;}
</style>
