import { app, BrowserWindow } from 'electron'
import type { Server } from 'node:http'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let apiServer: Server | null = null
let apiBaseUrl: string | null = null

function getAppRoot() {
  return app.isPackaged ? app.getAppPath() : path.resolve(__dirname, '..')
}

async function findAvailablePort(startPort: number) {
  let port = startPort

  while (true) {
    const available = await new Promise<boolean>((resolve) => {
      const tester = createServer()
      tester.once('error', () => resolve(false))
      tester.once('listening', () => {
        tester.close(() => resolve(true))
      })
      tester.listen(port, '127.0.0.1')
    })

    if (available) {
      return port
    }

    port += 1
  }
}

async function startDesktopApiServer() {
  if (apiServer && apiBaseUrl) {
    return apiBaseUrl
  }

  const appRoot = getAppRoot()
  const port = await findAvailablePort(4010)
  const serverModulePath = path.join(appRoot, 'dist-server', 'server', 'index.js')
  const serverModuleUrl = pathToFileURL(serverModulePath).href
  const serverModule = (await import(serverModuleUrl)) as {
    startMockApiServer: (options?: { port?: number; host?: string }) => Promise<Server>
  }

  apiServer = await serverModule.startMockApiServer({ port, host: '127.0.0.1' })
  apiBaseUrl = `http://127.0.0.1:${port}/api`
  return apiBaseUrl
}

async function createMainWindow() {
  const appRoot = getAppRoot()
  const apiBase = await startDesktopApiServer()

  const window = new BrowserWindow({
    width: 1540,
    height: 980,
    minWidth: 1120,
    minHeight: 760,
    backgroundColor: '#1f2023',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [`--dis-gateway-api-base=${apiBase}`],
    },
  })

  const rendererUrl = process.env.ELECTRON_RENDERER_URL
  if (rendererUrl) {
    await window.loadURL(rendererUrl)
  } else {
    await window.loadFile(path.join(appRoot, 'dist', 'index.html'))
  }

  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null
    }
  })

  mainWindow = window
}

app.whenReady().then(async () => {
  await createMainWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })
}).catch((error) => {
  console.error('Failed to start Electron app', error)
  app.quit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  apiServer?.close()
  apiServer = null
  apiBaseUrl = null
})
