import {app, BrowserWindow, shell, dialog, ipcMain} from 'electron'
import squirrelStartup from 'electron-squirrel-startup'
import {isMac, getAssetPath, isDev} from './utils'
// import {createServer as httpServer} from 'http'
// import {Server as ioServer} from 'socket.io'
import {autoUpdater} from 'electron-updater'
import settings from 'electron-settings'
import MenuBuilder from './utils/menu'
import AutoLaunch from 'auto-launch'
import {fileURLToPath} from 'url'
import path from 'path'
// import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true

if (squirrelStartup)
	app.quit()

let mainWindow;

const createMainWindow = () => {

	if (mainWindow) {

		if (mainWindow.isMinimized())
			mainWindow.restore()

		mainWindow.focus()

		return

	}

	mainWindow = new BrowserWindow({
		width: 900,
		height: 600,
		frame: false,
		autoHideMenuBar: true,
		icon: getAssetPath('icon.png'),
		title: import.meta.env.VITE_APP_TITLE,
		webPreferences: {
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	})

	mainWindow.on('close', event => {

		if (!app.isQuitting) {

			event.preventDefault()
			mainWindow?.hide()

			if (isMac)
				app.dock.hide()

		}

	})

	mainWindow.on('closed', () => {
		mainWindow = null
		// server?.close()
	})

	mainWindow.webContents.setWindowOpenHandler(edata => {
		shell.openExternal(edata.url)
		return {action: 'deny'}
	})

	// and load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
	} else {
		mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
	}

}

const buildMenus = () => {

	// initialize menu builder
	const menu = new MenuBuilder(mainWindow)

	menu.buildMenu()
	menu.buildTray([
		{label: 'Show', click: () => {mainWindow?.show(); if (isMac) app.dock.show()}},
		{label: 'Quit', click: () => {app.isQuitting = true; app.quit()}}
	])

}

app.whenReady().then(() => {

	createMainWindow()
	buildMenus()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createMainWindow()
		} else {
			mainWindow.show()
		}
	})

	/*

	let socketPort = 3000

	socket server
	const server = httpServer()
	const io = new ioServer(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST']
		}
	})

	console.log(fingerprint.toString())

	// io connection
	io.on('connection', socket => {

		socket.on('request-stream', filePath => {

			if (!fs.existsSync(filePath))
				return socket.emit('error', 'File does not exist')

			const stream = fs.createReadStream(filePath, {highWaterMark: 1024 * 1024})

			stream.on('data', (chunk) => {
				socket.emit('audio-stream', chunk)
			})

			stream.on('end', () => {
				socket.emit('stream-end')
			})

		})

	})

	// server start
	server.listen(socketPort)

	// port in use check
	server.on('error', (e) => {
		if (e.code === 'EADDRINUSE') {
			console.error('Address in use, retrying...')
			setTimeout(() => {
				server.close()
				socketPort += 1
				server.listen(socketPort)
			}, 5000)
		}
	})

	*/

	autoUpdater.autoDownload = true
	autoUpdater.checkForUpdatesAndNotify()

	autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...')
	})

	autoUpdater.on('update-available', (info) => {
		dialog.showMessageBox({
			type: 'info',
			title: 'Update Available',
			message: `Version ${info.version} is available. Do you want to download it now?`,
			buttons: ['Yes', 'No']
		}).then(result => {
			if (result.response === 0) { // If 'Yes' is clicked
				autoUpdater.downloadUpdate()
			}
		})
	})

	autoUpdater.on('update-not-available', () => {
		dialog.showMessageBox({
			type: 'info',
			title: 'No Updates',
			message: 'You are using the latest version.',
		})
	})

	autoUpdater.on('error', (err) => {
		dialog.showMessageBox({
			type: 'error',
			title: 'Update Error',
			message: `An error occurred: ${err.message}`
		})
	})

	autoUpdater.on('download-progress', (progress) => {
		console.log(`Downloaded ${Math.round(progress.percent)}%`)
	})

	autoUpdater.on('update-downloaded', () => {
		dialog.showMessageBox({
			type: 'info',
			title: 'Update Ready',
			message: 'The update has been downloaded. Restart the application to apply the update.',
			buttons: ['Restart Now', 'Later']
		}).then(result => {
			if (result.response === 0) {
				autoUpdater.quitAndInstall()
			}
		})
	})

	if (!isDev) {
		const launcher = new AutoLaunch({name: import.meta.env.VITE_APP_TITLE})
		launcher.isEnabled().then(async (enabled) => {
			if (!enabled) launcher.enable()
		}).catch((err) => {
			console.log('auto_launcher_error', err.message)
		})
	}

})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit()
})

app.on('before-quit', () => {
	app.isQuitting = true
})

ipcMain.handle('get-token', async () => {
	// fetch token from storage
	return await settings.get('accessToken') || ''
})

ipcMain.handle('save-token', async (_, token) => {
	// save token to file
	await settings.set('accessToken', token)
})

ipcMain.handle('get-preferences', async () => {

	let autoStartup = true

	if (!isDev) {
		const launcher = new AutoLaunch({name: import.meta.env.VITE_APP_TITLE})
		autoStartup = await launcher.isEnabled()
	}

	return {
		autoStartup,
		autoUpdate: true,
		appVersion: app.getVersion()
	}

})

ipcMain.handle('open-folder', async () => {
	return dialog.showOpenDialog({
		properties: ['openDirectory', 'dontAddToRecent']
	})
})

ipcMain.handle('check-for-updates', () => {
	autoUpdater.checkForUpdates()
})