import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import iconPng from '../../resources/icon.png?asset'
import iconIco from '../../resources/icon.ico?asset'
// import { HelixFollowedChannel } from '@twurple/api'
import { twitchAPI } from './twitch'

var getChannel: (c: string) => any = async (_c) => {}

function popupWindow(url): BrowserWindow {
  // Create the browser window.
  const thisWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon: iconIco } : {}),
    webPreferences: {
      devTools: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      zoomFactor: 1.0
    }
  })

  thisWindow.setIcon(iconIco)


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

function loginWindow() {
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

      setTimeout(() => { window.close() }, 3000)
    }
  })
}

let mainWindow: BrowserWindow
function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon: iconIco } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true
    }
  })

  mainWindow.setIcon(iconIco)

  mainWindow.on('close', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  function buildMenu(followingChannels: any[] = []): void {
    // let followingChannelsTemplate = followingChannels.map(channel => {
    //   return {
    //     label: channel.label,
    //     click: () => {
    //       mainWindow.webContents.send("add_channel", channel)
    //     }
    //   }
    // })

    // const template = [
    //   {label: 'Login', click: loginWindow},
    //   {label: 'Following', submenu: followingChannelsTemplate},
    // ]
  
    // const menu = Menu.buildFromTemplate(template)
    // Menu.setApplicationMenu(menu)
    
    mainWindow.webContents.send("following_channels", followingChannels)
  }

  buildMenu()

  mainWindow.webContents.on('did-finish-load', async () => {
    // mainWindow.webContents.openDevTools()

    let token = await mainWindow.webContents.executeJavaScript(`localStorage.getItem("access_token")`)
    let apiClient = await twitchAPI(token, buildMenu)

    
    getChannel = async (channelName) => {
      console.log(channelName)
      let userInfo = await apiClient?.users.getUserByName(channelName)
      let stream = await userInfo?.getStream()

      let to_return: any = {
        id: userInfo?.id,
        picture: userInfo?.profilePictureUrl,
        name: userInfo?.name,
        display_name: userInfo?.displayName,
        game: stream?.gameName,
        title: stream?.title,
        startTime: (stream ? stream.startDate.valueOf() : null),
        viewers: (stream ? stream.viewers : null),
        label: (stream ? `[LIVE] ${userInfo?.displayName} | ${stream.gameName} | ${stream.title}` : `[OFFLINE] ${userInfo?.displayName}` ),
        streaming: (stream != null)
      }

      console.log(to_return)

      return to_return
    }
  })

//   mainWindow.webContents.on('did-finish-load', async () => {
//     await mainWindow.webContents.executeJavaScript(`function ffz_init()
// {
// 	var script = document.createElement('script');

// 	script.id = 'ffz_script';
// 	script.type = 'text/javascript';
// 	script.src = '//cdn2.frankerfacez.com/script/script.min.js?_=' + Date.now();

// 	if ( localStorage.ffzDebugMode == "true" ) {
// 		// Developer Mode is enabled. But is the server running? Check before
// 		// we include the script, otherwise someone could break their
// 		// experience and not be able to recover.
// 		var xhr = new XMLHttpRequest();
// 		xhr.open("GET", "//localhost:8000/dev_server", true);
// 		xhr.onload = function(e) {
// 			var resp = JSON.parse(xhr.responseText);
// 			console.log("FFZ: Development Server is present. Version " + resp.version + " running from: " + resp.path);
// 			script.src = "//localhost:8000/script/script.js?_=" + Date.now();
// 			document.body.classList.add("ffz-dev");
// 			document.head.appendChild(script);
// 		};
// 		xhr.onerror = function(e) {
// 			console.log("FFZ: Development Server is not present. Using CDN.");
// 			document.head.appendChild(script);
// 		};
// 		return xhr.send(null);
// 	}

// 	document.head.appendChild(script);
// }

// ffz_init();`)
//     console.log("FFZ Script Loaded")
    
//   })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // console.log(details.url)
    // let window = popupWindow(details.url)
    popupWindow(details.url)
    // if (details.url.includes("/popout/frankerfacez/chat?ffz-settings")) {
    //   window.webContents.on("did-finish-load", async () => {
        
    //     await window.webContents.executeJavaScript(`
    //       let oldSetItem = window.Storage.prototype.setItem
    //       window.Storage.prototype.setItem = function(key, value) {
    //         console.log("interesting... ", key, value)
    //         if (key.includes("FFZ:setting")) {
    //           window.electron.ipcRenderer.send("ffz-settings", key, value)
    //         }

    //         oldSetItem.apply(this, arguments);
    //       }
          
    //       function ffz_init() {
    //         var script = document.createElement('script');
          
    //         script.id = 'ffz_script';
    //         script.type = 'text/javascript';
    //         script.src = '//cdn2.frankerfacez.com/script/script.min.js?_=' + Date.now();
          
    //         if ( localStorage.ffzDebugMode == "true" ) {
    //           // Developer Mode is enabled. But is the server running? Check before
    //           // we include the script, otherwise someone could break their
    //           // experience and not be able to recover.
    //           var xhr = new XMLHttpRequest();
    //           xhr.open("GET", "//localhost:8000/dev_server", true);
    //           xhr.onload = function(e) {
    //             var resp = JSON.parse(xhr.responseText);
    //             console.log("FFZ: Development Server is present. Version " + resp.version + " running from: " + resp.path);
    //             script.src = "//localhost:8000/script/script.js?_=" + Date.now();
    //             document.body.classList.add("ffz-dev");
    //             document.head.appendChild(script);
    //           };
    //           xhr.onerror = function(e) {
    //             console.log("FFZ: Development Server is not present. Using CDN.");
    //             document.head.appendChild(script);
    //           };
    //           return xhr.send(null);
    //         }
          
    //         document.head.appendChild(script);
    //       }
          
    //       ffz_init();
    //     `)
    //     console.log("FFZ Script Loaded: SETTINGS POPUP!")
    //   })

    //   // window.webContents.on("cl")
    // }
    
    // shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadURL("https://multilurk.planet-bluto.net/")
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

  ipcMain.on('login', () => loginWindow())

  ipcMain.handle('get-channel', (_e, c) => getChannel(c))

  // ipcMain.on('iframe-loaded', async (_event, iframeObj) => {
  //   console.log(mainWindow.webContents.mainFrame.frames)
  //   let res = mainWindow.webContents.mainFrame.frames.find(f => f.url == iframeObj.url)

  //   if (res == null) { return }

  //   let frame = res as WebFrameMain
  //   await frame.executeJavaScript(`function ffz_init()
  //     {
  //       var script = document.createElement('script');
      
  //       script.id = 'ffz_script';
  //       script.type = 'text/javascript';
  //       script.src = '//cdn2.frankerfacez.com/script/script.min.js?_=' + Date.now();
      
  //       if ( localStorage.ffzDebugMode == "true" ) {
  //         // Developer Mode is enabled. But is the server running? Check before
  //         // we include the script, otherwise someone could break their
  //         // experience and not be able to recover.
  //         var xhr = new XMLHttpRequest();
  //         xhr.open("GET", "//localhost:8000/dev_server", true);
  //         xhr.onload = function(e) {
  //           var resp = JSON.parse(xhr.responseText);
  //           console.log("FFZ: Development Server is present. Version " + resp.version + " running from: " + resp.path);
  //           script.src = "//localhost:8000/script/script.js?_=" + Date.now();
  //           document.body.classList.add("ffz-dev");
  //           document.head.appendChild(script);
  //         };
  //         xhr.onerror = function(e) {
  //           console.log("FFZ: Development Server is not present. Using CDN.");
  //           document.head.appendChild(script);
  //         };
  //         return xhr.send(null);
  //       }
      
  //       document.head.appendChild(script);
  //     }
      
  //     ffz_init();`)
    
  //    console.log("FFZ Script Loaded: ", iframeObj.id)
  // })

  // ipcMain.on('ffz-settings', async (_event, key, value) => {
  //   console.log("Forwarding FFZ Settings: ", key, value)
  //   mainWindow.webContents.executeJavaScript(`localStorage.setItem(\`${key}\`, \`${value}\`)`)
  //   // let mainWindow.mainFrame.frames.find(f => f.url.includes("player.twitch.tv"))
  // })

  // ipcMain.on('prompt', (_promptText) => {
  //   dialog.
  // })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('web-contents-created', (_event, contents) => {
    contents.on("did-finish-load", async () => {
        
      await contents.executeJavaScript(`
        let oldSetItem = window.Storage.prototype.setItem
        window.Storage.prototype.setItem = function(key, value) {
          console.log("interesting... ", key, value)
          if (key.includes("FFZ:setting")) {
            window.electron.ipcRenderer.send("ffz-settings", key, value)
          }

          oldSetItem.apply(this, arguments);
        }
        
        function ffz_init() {
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
        
        ffz_init();
      `)
      console.log("FFZ Script Loaded: ", contents.getURL())
    })
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
