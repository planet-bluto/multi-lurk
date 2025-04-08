import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
// import { HelixFollowedChannel } from '@twurple/api'
import { twitchAPI } from './twitch'

function popupWindow(url): BrowserWindow {
  // Create the browser window.
  const thisWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      devTools: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  thisWindow.on('ready-to-show', () => {
    thisWindow.show()
  })

  thisWindow.webContents.setWindowOpenHandler((details) => {
    popupWindow(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  thisWindow.loadURL(url)

  return thisWindow
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  function buildMenu(followingChannels: any[] = []): void {
    let followingChannelsTemplate = followingChannels.map(channel => {
      return {
        label: channel.label,
        click: () => {
          mainWindow.webContents.send("add_channel", channel)
        }
      }
    })

    const template = [
      {label: 'Login', click: () => {
        let window = popupWindow("https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=ycckwz67ehj6urlv3dqz1ax9bcbo3j&redirect_uri=https://multilurk.planet-bluto.net/auth&scope=user%3Aread%3Afollows&state=c3ab8aa609ea11e793ae92361f002671")
        console.log("Got window: ", window)
        window.webContents.on("did-redirect-navigation", async (_event) => {
          let {url} = _event
          console.log(url)
          if (url.startsWith("https://multilurk.planet-bluto.net/")) {
            const hash = url.split("#")[1]
            const params = new URLSearchParams(hash)
            const accessToken = params.get("access_token")
            console.log("Got Access Token: ", accessToken)
            
            mainWindow.webContents.send("access_token", accessToken)
  
            window.close()
          }
        })
      }},
      {label: 'Following', submenu: followingChannelsTemplate},
    ]
  
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }

  buildMenu()

  mainWindow.webContents.on('did-finish-load', async () => {
    let token = await mainWindow.webContents.executeJavaScript(`localStorage.getItem("access_token")`)
    twitchAPI(token, buildMenu)
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    popupWindow(details.url)
    // shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // ipcMain.on('prompt', (_promptText) => {
  //   dialog.
  // })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
