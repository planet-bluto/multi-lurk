import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    publicDir: resolve('resources'),
    server: {
      host: true,
      allowedHosts: ["multilurkbeta.planet-bluto.net"]
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()]
  }
})

// const CONFIG = Object.assign(BASE_CONFIG, {server: {
//   host: "0.0.0.0",
//   allowedHosts: ["multilurkbeta.planet-bluto.net"],
  
// },
// publicDir: resolve("resources")})

// console.log(CONFIG)

// export default CONFIG